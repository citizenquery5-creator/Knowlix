import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ebook, Category } from '../lib/types';
import { navigate } from '../lib/router';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import EbookCard from '../components/ebooks/EbookCard';
import UploadModal from '../components/documents/UploadModal';

export default function EbooksPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('ebooks')
      .select('*, category:categories(name, slug, color)')
      .eq('is_approved', true)
      .limit(24);

    if (search) query = query.ilike('title', `%${search}%`);
    if (sort === 'latest') query = query.order('created_at', { ascending: false });
    else if (sort === 'downloads') query = query.order('download_count', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });

    const { data } = await query;
    setEbooks((data as Ebook[]) ?? []);
    setLoading(false);
  }, [search, sort]);

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLike = async (ebookId: string, liked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (liked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('ebook_id', ebookId);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, ebook_id: ebookId });
    }
    setEbooks(prev => prev.map(e =>
      e.id === ebookId ? { ...e, user_liked: !liked, like_count: e.like_count + (liked ? -1 : 1) } : e
    ));
  };

  const handleBookmark = async (ebookId: string, bookmarked: boolean) => {
    if (!user) { toast(t('loginRequired'), 'warning'); navigate('/auth'); return; }
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('ebook_id', ebookId);
    } else {
      await supabase.from('bookmarks').insert({ user_id: user.id, ebook_id: ebookId });
    }
    setEbooks(prev => prev.map(e =>
      e.id === ebookId ? { ...e, user_bookmarked: !bookmarked } : e
    ));
    toast(bookmarked ? 'Removed from saved' : 'Saved!', 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-700 to-primary-700 py-12 text-white">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading mb-1">{t('ebooks')}</h1>
              <p className="text-accent-200">Discover and read e-books online</p>
            </div>
            {user && (
              <button onClick={() => setShowUpload(true)} className="btn bg-white text-accent-700 hover:bg-accent-50 w-fit">
                <Upload className="w-4 h-4" /> {t('uploadEbook')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search e-books by title or author..." className="input pl-9"
            />
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)} className="input pr-8 appearance-none min-w-36">
              <option value="latest">Latest</option>
              <option value="downloads">Most Downloaded</option>
              <option value="rating">Top Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="h-48 bg-neutral-200 dark:bg-neutral-700" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">No e-books found</h3>
            <p className="text-neutral-500 text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {ebooks.map(ebook => (
              <EbookCard
                key={ebook.id}
                ebook={ebook}
                onLike={() => handleLike(ebook.id, !!ebook.user_liked)}
                onBookmark={() => handleBookmark(ebook.id, !!ebook.user_bookmarked)}
              />
            ))}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); load(); toast(t('uploadSuccess'), 'success'); }}
          categories={categories}
          type="ebook"
        />
      )}
    </div>
  );
}
