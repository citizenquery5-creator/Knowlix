import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Download, Lock, Loader2, ArrowLeft, Search, X,
  ZoomIn, ZoomOut, Maximize, Minimize, ChevronUp, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document } from '../lib/types';
import { navigate } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { checkDownloadAccess } from '../lib/subscription';

interface DocumentDetailPageProps {
  docId: string;
}

export default function DocumentDetailPage({ docId }: DocumentDetailPageProps) {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [readerUrl, setReaderUrl] = useState('');
  const [readerReady, setReaderReady] = useState(false);

  // Reader controls
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNum, setPageNum] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadDoc = useCallback(async () => {
    const { data } = await supabase
      .from('documents')
      .select('*, category:categories(*)')
      .eq('id', docId)
      .maybeSingle();

    if (!data) { navigate('/documents'); return; }
    setDoc(data as Document);

    // Increment view count
    supabase.from('documents').update({ view_count: (data.view_count || 0) + 1 }).eq('id', docId);

    // Get signed URL for reader
    if (data.file_path) {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(data.file_path, 3600);
      if (urlData?.signedUrl) {
        setReaderUrl(urlData.signedUrl);
      }
    }

    setLoading(false);
  }, [docId]);

  useEffect(() => { loadDoc(); }, [loadDoc]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) { toggleFullscreen(); }
      if (e.key === 'Escape' && showSearch) { setShowSearch(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === '+' || e.key === '=') { setZoom(z => Math.min(300, z + 25)); }
      if (e.key === '-' || e.key === '_') { setZoom(z => Math.max(50, z - 25)); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen, showSearch]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleDownload = async () => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (!doc) return;

    if (!doc.is_downloadable) {
      toast('Downloads are disabled for this document', 'warning');
      return;
    }

    const access = await checkDownloadAccess(user, profile, doc);

    if (!access.canDownload) {
      if (access.reason === 'login_required') { navigate('/auth'); return; }
      if (access.reason === 'trial_expired') {
        toast('Your free trial has expired. Upgrade to continue downloading.', 'warning');
        navigate('/pricing'); return;
      }
      if (access.reason === 'subscription_expired') {
        toast('Your subscription has expired. Renew to continue downloading.', 'warning');
        navigate('/pricing'); return;
      }
      if (access.reason === 'premium_required') {
        toast('This is a premium document. Upgrade to download.', 'warning');
        navigate('/pricing'); return;
      }
      if (access.reason === 'no_plan') { navigate('/pricing'); return; }
    }

    if (profile?.role === 'free_user' && (profile.downloads_today ?? 0) >= 1) {
      toast(t('noDownloadsLeft'), 'warning');
      navigate('/pricing'); return;
    }

    setDownloading(true);
    try {
      const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300);

      const downloadUrl = urlData?.signedUrl ?? doc.file_url;
      if (!downloadUrl) { toast('File not available', 'error'); return; }

      await supabase.from('downloads').insert({ user_id: user.id, document_id: doc.id });
      await supabase.from('documents').update({ download_count: doc.download_count + 1 }).eq('id', doc.id);
      setDoc(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : prev);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${doc.title}.${doc.file_type}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast('Download started!', 'success');
    } finally {
      setDownloading(false);
    }
  };

  const zoomIn = () => setZoom(z => Math.min(300, z + 25));
  const zoomOut = () => setZoom(z => Math.max(50, z - 25));
  const scrollUp = () => scrollRef.current?.scrollBy({ top: -300, behavior: 'smooth' });
  const scrollDown = () => scrollRef.current?.scrollBy({ top: 300, behavior: 'smooth' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  if (!doc) return null;

  const isPdf = doc.file_type === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(doc.file_type);
  const canAccess = !doc.is_premium ||
    ['admin', 'premium_user', 'creator'].includes(profile?.role ?? '');

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`}
    >
      {/* Minimal Top Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/documents')}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{doc.title}</h1>
            {doc.category && (
              <p className="text-xs text-neutral-400 truncate">{doc.category.name}</p>
            )}
          </div>
        </div>

        {/* Essential Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Search */}
          <button
            onClick={() => setShowSearch(s => !s)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              showSearch
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="Search (Ctrl+F)"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={zoomOut}
            disabled={zoom <= 50}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>

          {/* Zoom Level */}
          <span className="text-xs font-medium text-neutral-500 min-w-12 text-center hidden sm:inline">
            {zoom}%
          </span>

          {/* Zoom In */}
          <button
            onClick={zoomIn}
            disabled={zoom >= 300}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading || !doc.is_downloadable}
            className="flex items-center gap-1.5 px-3 sm:px-4 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {downloading ? 'Downloading...' : !doc.is_downloadable ? 'Disabled' : 'Download'}
            </span>
          </button>
        </div>
      </header>

      {/* Search Bar (collapsible) */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 animate-slide-down">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="flex-1 bg-transparent text-sm text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 outline-none"
            autoFocus
          />
          {searchQuery && (
            <span className="text-xs text-neutral-400 hidden sm:inline">Press Enter</span>
          )}
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Reader Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {canAccess ? (
          readerUrl ? (
            <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
              {isPdf ? (
                <iframe
                  src={`${readerUrl}#view=FitH&zoom=${zoom}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
                  className="w-full h-full min-h-[80vh] bg-white rounded-lg shadow-xl"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  title={doc.title}
                  onLoad={() => setReaderReady(true)}
                />
              ) : isImage ? (
                <img
                  src={readerUrl}
                  alt={doc.title}
                  className="max-w-none rounded-lg shadow-xl transition-transform"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  onLoad={() => setReaderReady(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-5">
                    <Download className="w-10 h-10 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Preview not available
                  </h3>
                  <p className="text-sm text-neutral-400 mb-6 max-w-sm">
                    Inline reading isn't supported for {doc.file_type.toUpperCase()} files. Download to view.
                  </p>
                  <button
                    onClick={handleDownload}
                    disabled={downloading || !doc.is_downloadable}
                    className="btn-primary"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download to View
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          )
        ) : (
          /* Premium lock screen */
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-5">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Premium Document</h2>
            <p className="text-sm text-neutral-500 mb-6 max-w-sm">
              Upgrade to access this document and read it online.
            </p>
            <a href="#/pricing" className="btn-primary">
              Upgrade to Pro
            </a>
          </div>
        )}
      </div>

      {/* Floating Scroll Controls */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-20">
        <button
          onClick={scrollUp}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full shadow-lg hover:shadow-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
          title="Scroll Up"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          onClick={scrollDown}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full shadow-lg hover:shadow-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
          title="Scroll Down"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
