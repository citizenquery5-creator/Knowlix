import { useState, useEffect } from 'react';
import {
  Download, Eye, Heart, Bookmark, Share2, ArrowLeft, ChevronRight,
  Book, User, Calendar, FileText, Lock, Star, Loader2, X,
  ChevronLeft, ChevronRight as ChevronRightIcon, RotateCcw, ZoomIn, ZoomOut,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ebook } from '../lib/types';
import { navigate } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { formatCount, formatDate, formatBytes } from '../lib/utils';

interface EbookDetailPageProps { ebookId: string; }

export default function EbookDetailPage({ ebookId }: EbookDetailPageProps) {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ebooks')
        .select('*, category:categories(*), uploader:profiles(full_name, avatar_url, role)')
        .eq('id', ebookId)
        .maybeSingle();
      if (!data) { navigate('/ebooks'); return; }
      setEbook(data as Ebook);
      supabase.from('ebooks').update({ view_count: (data.view_count || 0) + 1 }).eq('id', ebookId);

      if (user) {
        const [likeRes, bmRes, progressRes] = await Promise.all([
          supabase.from('likes').select('id').eq('user_id', user.id).eq('ebook_id', ebookId).maybeSingle(),
          supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('ebook_id', ebookId).maybeSingle(),
          supabase.from('reading_progress').select('*').eq('user_id', user.id).eq('ebook_id', ebookId).maybeSingle(),
        ]);
        setEbook(prev => prev ? { ...prev, user_liked: !!likeRes.data, user_bookmarked: !!bmRes.data, reading_progress: progressRes.data ?? undefined } : prev);
        if (progressRes.data) setCurrentPage(progressRes.data.current_page);
      }
      setLoading(false);
    };
    load();
  }, [ebookId, user]);

  const canAccess = !ebook?.is_premium || ['admin', 'premium_user', 'creator'].includes(profile?.role ?? '');

  const handleRead = () => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (!canAccess) { toast('Upgrade to access premium e-books', 'warning'); navigate('/pricing'); return; }
    setReading(true);
    supabase.from('reading_progress').upsert({
      user_id: user.id, ebook_id: ebookId,
      current_page: currentPage, total_pages: ebook?.pages || 1,
      progress_percent: Math.round((currentPage / (ebook?.pages || 1)) * 100),
      last_read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,ebook_id' });
  };

  const handleDownload = async () => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (!canAccess || !ebook) { toast('Upgrade to download premium e-books', 'warning'); navigate('/pricing'); return; }

    setDownloading(true);
    await supabase.from('downloads').insert({ user_id: user.id, ebook_id: ebook.id });
    await supabase.from('ebooks').update({ download_count: ebook.download_count + 1 }).eq('id', ebook.id);
    setEbook(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : prev);

    if (ebook.file_url) {
      const link = document.createElement('a');
      link.href = ebook.file_url;
      link.download = `${ebook.title}.${ebook.file_type}`;
      link.target = '_blank';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast('Download started!', 'success');
    }
    setDownloading(false);
  };

  const handleLike = async () => {
    if (!user || !ebook) return;
    if (ebook.user_liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('ebook_id', ebook.id);
      setEbook(prev => prev ? { ...prev, user_liked: false, like_count: prev.like_count - 1 } : prev);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, ebook_id: ebook.id });
      setEbook(prev => prev ? { ...prev, user_liked: true, like_count: prev.like_count + 1 } : prev);
    }
  };

  const handleBookmark = async () => {
    if (!user || !ebook) return;
    if (ebook.user_bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('ebook_id', ebook.id);
      setEbook(prev => prev ? { ...prev, user_bookmarked: false } : prev);
      toast('Removed from saved', 'info');
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, ebook_id: ebook.id });
      setEbook(prev => prev ? { ...prev, user_bookmarked: true } : prev);
      toast('Saved!', 'success');
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
  if (!ebook) return null;

  // Reader view
  if (reading && ebook.file_url) {
    return (
      <div className="fixed inset-0 bg-neutral-900 z-40 flex flex-col">
        {/* Reader toolbar */}
        <div className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setReading(false)} className="text-white/70 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="text-white font-medium text-sm truncate max-w-xs">{ebook.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-white/70 hover:text-white">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-white text-sm w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-white/70 hover:text-white">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(100)} className="text-white/70 hover:text-white">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          {ebook.pages > 0 && (
            <div className="flex items-center gap-2 text-white text-sm">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="text-white/70 hover:text-white disabled:opacity-30" disabled={currentPage <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Page {currentPage} / {ebook.pages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(ebook.pages, p + 1))} className="text-white/70 hover:text-white disabled:opacity-30" disabled={currentPage >= ebook.pages}>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-auto flex items-start justify-center bg-neutral-700 p-4">
          <div style={{ width: `${zoom}%`, minWidth: '300px', maxWidth: '100%' }}>
            {ebook.file_type === 'pdf' ? (
              <iframe
                src={`${ebook.file_url}#page=${currentPage}`}
                className="w-full bg-white rounded shadow-xl"
                style={{ height: '85vh' }}
                title={ebook.title}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-8 min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                  <Book className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">EPUB reading is best in a dedicated app.</p>
                  <button onClick={handleDownload} className="btn-primary mt-4">
                    <Download className="w-4 h-4" /> Download EPUB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const fallbackGradients = ['from-indigo-500 to-purple-600', 'from-blue-500 to-cyan-600', 'from-violet-500 to-pink-600'];
  const gradientIdx = ebook.title.charCodeAt(0) % fallbackGradients.length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="page-container py-8">
        <button onClick={() => navigate('/ebooks')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to E-Books
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Cover & actions */}
          <div className="lg:col-span-1 space-y-5">
            {/* Cover */}
            <div className={`w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br ${fallbackGradients[gradientIdx]} shadow-elevated max-w-64 mx-auto lg:mx-0`}>
              {ebook.cover_url ? (
                <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <Book className="w-16 h-16 text-white/60 mb-4" />
                  <h3 className="text-white font-bold text-center text-lg leading-tight">{ebook.title}</h3>
                  {ebook.author && <p className="text-white/70 text-sm mt-2 text-center">{ebook.author}</p>}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button onClick={handleRead} className="btn-primary btn-lg w-full">
                <Book className="w-5 h-5" />
                {ebook.reading_progress ? t('continueReading') : t('startReading')}
              </button>
              <button onClick={handleDownload} disabled={downloading} className="btn-secondary btn-lg w-full">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-5 h-5" />}
                {t('download')}
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={handleLike} className={`btn-sm flex flex-col items-center gap-1 py-3 rounded-xl border ${ebook.user_liked ? 'bg-error-50 border-error-200 text-error-600' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                  <Heart className={`w-4 h-4 ${ebook.user_liked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{formatCount(ebook.like_count)}</span>
                </button>
                <button onClick={handleBookmark} className={`btn-sm flex flex-col items-center gap-1 py-3 rounded-xl border ${ebook.user_bookmarked ? 'bg-primary-50 border-primary-200 text-primary-600' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                  <Bookmark className={`w-4 h-4 ${ebook.user_bookmarked ? 'fill-current' : ''}`} />
                  <span className="text-xs">Save</span>
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast('Link copied!', 'success'); }} className="btn-sm flex flex-col items-center gap-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs">Share</span>
                </button>
              </div>
            </div>

            {/* Reading progress */}
            {ebook.reading_progress && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-white mb-3">{t('readingProgress')}</h3>
                <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                  <span>Page {ebook.reading_progress.current_page}</span>
                  <span>{ebook.reading_progress.progress_percent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${ebook.reading_progress.progress_percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex flex-wrap gap-2 mb-3">
                {ebook.category && <span className="badge-primary text-xs">{ebook.category.name}</span>}
                {ebook.is_premium && <span className="badge bg-amber-100 text-amber-700 text-xs"><Lock className="w-3 h-3" /> Premium</span>}
                <span className="badge-neutral text-xs">{ebook.file_type.toUpperCase()}</span>
              </div>

              <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-2">{ebook.title}</h1>

              {ebook.author && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 mb-3">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">by {ebook.author}</span>
                </div>
              )}

              {ebook.rating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(ebook.rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 dark:text-neutral-700'}`} />
                  ))}
                  <span className="text-sm text-neutral-500 ml-1">{ebook.rating.toFixed(1)}</span>
                </div>
              )}

              {ebook.description && (
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm mb-4">{ebook.description}</p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { icon: <Eye />, value: formatCount(ebook.view_count), label: 'Views' },
                  { icon: <Download />, value: formatCount(ebook.download_count), label: 'Downloads' },
                  { icon: <FileText />, value: ebook.pages > 0 ? `${ebook.pages}pp` : '—', label: 'Pages' },
                  { icon: <Calendar />, value: ebook.publish_year ?? '—', label: 'Year' },
                ].map(({ icon, value, label }) => (
                  <div key={label} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                    <div className="flex justify-center text-primary-500 mb-1">{icon}</div>
                    <div className="font-bold text-neutral-900 dark:text-white text-sm">{value}</div>
                    <div className="text-xs text-neutral-500">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Book details */}
            <div className="card p-6">
              <h2 className="font-semibold text-neutral-900 dark:text-white mb-4">Book Details</h2>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  ebook.publisher && ['Publisher', ebook.publisher],
                  ebook.isbn && ['ISBN', ebook.isbn],
                  ['Language', ebook.language === 'hi' ? 'Hindi' : 'English'],
                  ['File Size', formatBytes(ebook.file_size)],
                  ['Format', ebook.file_type.toUpperCase()],
                  ['Upload Date', formatDate(ebook.created_at)],
                ].filter(Boolean).map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-neutral-500 mb-0.5">{label}</dt>
                    <dd className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

