import { useState, useEffect, useCallback } from 'react';
import { Search, X, BookOpen, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Ebook, Category } from '../lib/types';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useQueryParams, navigate } from '../lib/router';
import DocumentCard from '../components/documents/DocumentCard';
import EbookCard from '../components/ebooks/EbookCard';

export default function SearchPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useQueryParams();

  const [query, setQuery] = useState(params.get('q') ?? '');
  const [inputQuery, setInputQuery] = useState(params.get('q') ?? '');
  const [contentType, setContentType] = useState<'all' | 'documents' | 'ebooks'>('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const popularSearches = [
    'Nursing Notes', 'B.Sc Nursing', 'AIIMS Question Paper', 'Medical Notes',
    'GNM Study Material', 'ANM Notes', 'Previous Year Papers', 'Community Health',
  ];

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, []);

  useEffect(() => {
    const q = params.get('q');
    if (q) { setQuery(q); setInputQuery(q); }
  }, [params]);

  const runSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);

    const catId = selectedCategory
      ? (categories.find(c => c.slug === selectedCategory || c.name === selectedCategory)?.id)
      : null;

    const orderField = sort === 'downloads' ? 'download_count' : sort === 'views' ? 'view_count' : 'created_at';
    const orderAsc = false;

    const [docsRes, ebooksRes] = await Promise.all([
      contentType !== 'ebooks'
        ? (() => {
          let q = supabase
            .from('documents')
            .select('*, category:categories(name, color, slug), uploader:profiles(full_name)')
            .eq('is_approved', true)
            .ilike('title', `%${searchQuery}%`)
            .order(orderField, { ascending: orderAsc })
            .limit(20);
          if (catId) q = q.eq('category_id', catId);
          return q;
        })()
        : Promise.resolve({ data: [] }),
      contentType !== 'documents'
        ? (() => {
          let q = supabase
            .from('ebooks')
            .select('*, category:categories(name, color, slug)')
            .eq('is_approved', true)
            .ilike('title', `%${searchQuery}%`)
            .order(orderField, { ascending: orderAsc })
            .limit(20);
          if (catId) q = q.eq('category_id', catId);
          return q;
        })()
        : Promise.resolve({ data: [] }),
    ]);

    setDocuments((docsRes.data as Document[]) ?? []);
    setEbooks((ebooksRes.data as Ebook[]) ?? []);
    setLoading(false);
  }, [contentType, selectedCategory, sort, categories]);

  useEffect(() => {
    if (query) runSearch(query);
  }, [query, runSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    setQuery(inputQuery);
    navigate(`/search?q=${encodeURIComponent(inputQuery)}`);
  };

  const handleDocLike = async (docId: string, liked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (liked) await supabase.from('likes').delete().eq('user_id', user.id).eq('document_id', docId);
    else await supabase.from('likes').insert({ user_id: user.id, document_id: docId });
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, user_liked: !liked, like_count: d.like_count + (liked ? -1 : 1) } : d));
  };

  const handleDocBookmark = async (docId: string, bookmarked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (bookmarked) await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('document_id', docId);
    else await supabase.from('bookmarks').insert({ user_id: user.id, document_id: docId });
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, user_bookmarked: !bookmarked } : d));
    toast(bookmarked ? 'Removed from saved' : 'Saved!', 'success');
  };

  const handleEbookLike = async (ebookId: string, liked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (liked) await supabase.from('likes').delete().eq('user_id', user.id).eq('ebook_id', ebookId);
    else await supabase.from('likes').insert({ user_id: user.id, ebook_id: ebookId });
    setEbooks(prev => prev.map(e => e.id === ebookId ? { ...e, user_liked: !liked, like_count: e.like_count + (liked ? -1 : 1) } : e));
  };

  const handleEbookBookmark = async (ebookId: string, bookmarked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (bookmarked) await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('ebook_id', ebookId);
    else await supabase.from('bookmarks').insert({ user_id: user.id, ebook_id: ebookId });
    setEbooks(prev => prev.map(e => e.id === ebookId ? { ...e, user_bookmarked: !bookmarked } : e));
    toast(bookmarked ? 'Removed from saved' : 'Saved!', 'success');
  };

  const totalResults = documents.length + ebooks.length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      {/* Search header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 py-8">
        <div className="page-container">
          <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-4">{t('search')}</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="input pl-11 text-base py-3"
                autoFocus
              />
              {inputQuery && (
                <button type="button" onClick={() => { setInputQuery(''); setQuery(''); setSearched(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary px-6">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      <div className="page-container py-6">
        {/* Filters */}
        {searched && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Type filter */}
            <div className="flex rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
              {(['all', 'documents', 'ebooks'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                    contentType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                  }`}
                >
                  {type === 'all' ? `All (${totalResults})` : type === 'documents' ? `Docs (${documents.length})` : `E-Books (${ebooks.length})`}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="relative">
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input pr-8 appearance-none min-w-40">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value)} className="input pr-8 appearance-none min-w-36">
                <option value="latest">Latest</option>
                <option value="downloads">Most Downloaded</option>
                <option value="views">Most Viewed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : !searched ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Start Searching</h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">Search across thousands of documents and e-books</p>
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">Popular Searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularSearches.map(term => (
                  <button
                    key={term}
                    onClick={() => { setInputQuery(term); setQuery(term); navigate(`/search?q=${encodeURIComponent(term)}`); }}
                    className="badge-neutral text-sm px-3 py-1.5 hover:badge-primary transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : totalResults === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('noResults')}</h3>
            <p className="text-neutral-500 text-sm mb-4">No results for "<strong>{query}</strong>"</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.slice(0, 4).map(term => (
                <button key={term} onClick={() => { setInputQuery(term); setQuery(term); navigate(`/search?q=${encodeURIComponent(term)}`); }} className="badge-neutral text-sm px-3 py-1.5">
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <p className="text-sm text-neutral-500">
              Found <strong>{totalResults}</strong> results for "<strong>{query}</strong>"
            </p>

            {/* Documents results */}
            {documents.length > 0 && contentType !== 'ebooks' && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="font-semibold text-neutral-900 dark:text-white">Documents ({documents.length})</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {documents.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onLike={() => handleDocLike(doc.id, !!doc.user_liked)}
                      onBookmark={() => handleDocBookmark(doc.id, !!doc.user_bookmarked)}
                      onDownload={() => navigate(`/documents/${doc.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* E-Books results */}
            {ebooks.length > 0 && contentType !== 'documents' && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-5 h-5 text-accent-600" />
                  <h2 className="font-semibold text-neutral-900 dark:text-white">E-Books ({ebooks.length})</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {ebooks.map(ebook => (
                    <EbookCard
                      key={ebook.id}
                      ebook={ebook}
                      onLike={() => handleEbookLike(ebook.id, !!ebook.user_liked)}
                      onBookmark={() => handleEbookBookmark(ebook.id, !!ebook.user_bookmarked)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
