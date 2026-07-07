import { useState, useEffect, useCallback } from 'react';
import { Search, SortAsc, Grid, List, Upload, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Category } from '../lib/types';
import { navigate } from '../lib/router';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import DocumentCard from '../components/documents/DocumentCard';
import UploadModal from '../components/documents/UploadModal';

interface DocumentsPageProps {
  initialSort?: string;
}

export default function DocumentsPage({ initialSort = 'latest' }: DocumentsPageProps) {
  const { t } = useLang();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sort, setSort] = useState(initialSort);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');
    setCategories((data as Category[]) ?? []);
  }, []);

  const loadDocuments = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 0 : page;
    if (reset) setPage(0);

    let query = supabase
      .from('documents')
      .select('*, category:categories(name, slug, color, icon), uploader:profiles(full_name, avatar_url)')
      .eq('is_approved', true)
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (search) query = query.ilike('title', `%${search}%`);
    if (selectedType) query = query.eq('file_type', selectedType);
    if (showPremiumOnly) query = query.eq('is_premium', true);

    if (sort === 'latest') query = query.order('created_at', { ascending: false });
    else if (sort === 'downloads') query = query.order('download_count', { ascending: false });
    else if (sort === 'views') query = query.order('view_count', { ascending: false });
    else if (sort === 'likes') query = query.order('like_count', { ascending: false });

    const { data } = await query;
    const docs = (data as Document[]) ?? [];

    if (reset) {
      setDocuments(docs);
    } else {
      setDocuments(prev => [...prev, ...docs]);
    }
    setHasMore(docs.length === PAGE_SIZE);
    setLoading(false);
  }, [page, search, selectedType, sort, showPremiumOnly]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    loadDocuments(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedType, sort, showPremiumOnly]);

  const handleLike = async (docId: string, liked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('document_id', docId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, document_id: docId });
    }
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, user_liked: !liked, like_count: d.like_count + (liked ? -1 : 1) } : d
    ));
  };

  const handleBookmark = async (docId: string, bookmarked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('document_id', docId);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, document_id: docId });
    }
    setDocuments(prev => prev.map(d =>
      d.id === docId ? { ...d, user_bookmarked: !bookmarked } : d
    ));
    toast(bookmarked ? 'Removed from saved' : 'Saved to bookmarks', 'success');
  };

  const loadMore = () => {
    setPage(p => p + 1);
    loadDocuments(false);
  };

  const clearFilters = () => {
    setSearch(''); setSelectedType('');
    setSort('latest'); setShowPremiumOnly(false);
  };

  const hasFilters = search || selectedType || showPremiumOnly || sort !== 'latest';

  const fileTypes = ['pdf', 'docx', 'ppt', 'pptx', 'txt'];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      {/* Page Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 py-8">
        <div className="page-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">{t('documents')}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Browse thousands of study materials</p>
            </div>
            {(user?.id) && (
              <button onClick={() => setShowUpload(true)} className="btn-primary">
                <Upload className="w-4 h-4" />
                {t('uploadDoc')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="input pl-9"
            />
          </div>

          {/* File Type */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer min-w-32"
            >
              <option value="">All Types</option>
              {fileTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input pr-8 appearance-none cursor-pointer min-w-36"
            >
              <option value="latest">Latest</option>
              <option value="downloads">Most Downloaded</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          {/* Premium toggle */}
          <button
            onClick={() => setShowPremiumOnly(!showPremiumOnly)}
            className={`btn-sm ${showPremiumOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            Premium Only
          </button>

          {/* View mode */}
          <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-50'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-50'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>

          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost btn-sm text-error-500 hover:bg-error-50">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        {loading && documents.length === 0 ? (
          <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'}`}>
            {Array.from({ length: 8 }).map((_, i) => <DocumentSkeleton key={i} />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('noResults')}</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="text-sm text-neutral-500 mb-4">
              Showing {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </div>
            <div className={`grid gap-5 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  compact={viewMode === 'list'}
                  onView={() => navigate(`/documents/${doc.id}`)}
                  onLike={() => handleLike(doc.id, !!doc.user_liked)}
                  onBookmark={() => handleBookmark(doc.id, !!doc.user_bookmarked)}
                  onDownload={() => navigate(`/documents/${doc.id}`)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button onClick={loadMore} disabled={loading} className="btn-secondary btn-lg">
                  {loading ? t('loading') : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); loadDocuments(true); toast(t('uploadSuccess'), 'success'); }}
          categories={categories}
        />
      )}
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-44 bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
      </div>
    </div>
  );
}
