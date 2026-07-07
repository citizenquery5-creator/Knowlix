import { useState, useEffect, useCallback } from 'react';
import {
  Upload, BarChart2, TrendingUp, Eye, Download, Heart, FileText,
  BookOpen, CheckCircle, Clock, XCircle, Plus, Trash2, Loader2,
  DollarSign, Users, Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Ebook, Category } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { navigate } from '../lib/router';
import { formatCount, timeAgo } from '../lib/utils';
import UploadModal from '../components/documents/UploadModal';

type Tab = 'overview' | 'documents' | 'ebooks' | 'analytics' | 'earnings';

export default function CreatorDashboard() {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showUploadEbook, setShowUploadEbook] = useState(false);

  const stats = {
    totalUploads: documents.length + ebooks.length,
    totalViews: [...documents, ...ebooks].reduce((a, d) => a + d.view_count, 0),
    totalDownloads: [...documents, ...ebooks].reduce((a, d) => a + d.download_count, 0),
    totalLikes: [...documents, ...ebooks].reduce((a, d) => a + d.like_count, 0),
    approved: documents.filter(d => d.status === 'approved').length + ebooks.filter(e => e.status === 'approved').length,
    pending: documents.filter(d => d.status === 'pending').length + ebooks.filter(e => e.status === 'pending').length,
  };

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (!['admin', 'creator', 'premium_user'].includes(profile?.role ?? '')) {
      toast('Creator access required. Upgrade to Premium.', 'warning');
      navigate('/pricing');
      return;
    }
    loadData();
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [docsRes, ebooksRes] = await Promise.all([
      supabase.from('documents').select('*, category:categories(name)').eq('uploader_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ebooks').select('*, category:categories(name)').eq('uploader_id', user.id).order('created_at', { ascending: false }),
    ]);
    setDocuments((docsRes.data as Document[]) ?? []);
    setEbooks((ebooksRes.data as Ebook[]) ?? []);
    setLoading(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast('Deleted', 'success');
  };

  const handleDeleteEbook = async (id: string) => {
    if (!confirm('Delete this e-book?')) return;
    await supabase.from('ebooks').delete().eq('id', id);
    setEbooks(prev => prev.filter(e => e.id !== id));
    toast('Deleted', 'success');
  };

  if (!user || !profile) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'documents' as Tab, label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'ebooks' as Tab, label: 'E-Books', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'analytics' as Tab, label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="page-container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">{t('creatorDashboard')}</h1>
            <p className="text-neutral-500 text-sm mt-1">Manage your content and track performance</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUploadDoc(true)} className="btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Upload Document
            </button>
            <button onClick={() => setShowUploadEbook(true)} className="btn-secondary btn-sm">
              <Plus className="w-4 h-4" /> Upload E-Book
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Upload className="w-5 h-5" />, value: stats.totalUploads, label: 'Total Uploads', color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
            { icon: <Eye className="w-5 h-5" />, value: formatCount(stats.totalViews), label: 'Total Views', color: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/30' },
            { icon: <Download className="w-5 h-5" />, value: formatCount(stats.totalDownloads), label: 'Downloads', color: 'text-success-600 bg-success-50 dark:bg-success-900/30' },
            { icon: <Heart className="w-5 h-5" />, value: formatCount(stats.totalLikes), label: 'Total Likes', color: 'text-error-600 bg-error-50 dark:bg-error-900/30' },
          ].map(({ icon, value, label, color }) => (
            <div key={label} className="card p-5">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 ${color}`}>
                {icon}
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
              <div className="text-sm text-neutral-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-soft'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Content Status</h3>
              <div className="space-y-3">
                {[
                  { label: 'Approved', value: stats.approved, icon: <CheckCircle className="w-4 h-4 text-success-500" />, color: 'bg-success-500' },
                  { label: 'Pending', value: stats.pending, icon: <Clock className="w-4 h-4 text-warning-500" />, color: 'bg-warning-500' },
                  { label: 'Total', value: stats.totalUploads, icon: <Upload className="w-4 h-4 text-primary-500" />, color: 'bg-primary-500' },
                ].map(({ label, value, icon, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${stats.totalUploads ? (value / stats.totalUploads) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white w-6 text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Recent Uploads</h3>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary-600" /></div>
              ) : (
                <div className="space-y-3">
                  {[...documents.slice(0, 3), ...ebooks.slice(0, 2)].slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{item.title}</p>
                        <p className="text-xs text-neutral-400">{timeAgo(item.created_at)}</p>
                      </div>
                      <span className={`badge text-[10px] ${item.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                  {documents.length === 0 && ebooks.length === 0 && (
                    <p className="text-sm text-neutral-400 text-center py-4">No uploads yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents tab */}
        {activeTab === 'documents' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">My Documents ({documents.length})</h3>
              <button onClick={() => setShowUploadDoc(true)} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Upload
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
            ) : documents.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 mb-4">No documents uploaded yet</p>
                <button onClick={() => setShowUploadDoc(true)} className="btn-primary btn-sm">Upload First Document</button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <ContentRow key={doc.id} item={doc} type="document" onDelete={handleDeleteDoc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ebooks tab */}
        {activeTab === 'ebooks' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-900 dark:text-white">My E-Books ({ebooks.length})</h3>
              <button onClick={() => setShowUploadEbook(true)} className="btn-primary btn-sm">
                <Plus className="w-4 h-4" /> Upload
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
            ) : ebooks.length === 0 ? (
              <div className="card p-12 text-center">
                <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 mb-4">No e-books uploaded yet</p>
                <button onClick={() => setShowUploadEbook(true)} className="btn-primary btn-sm">Upload First E-Book</button>
              </div>
            ) : (
              <div className="space-y-3">
                {ebooks.map(ebook => (
                  <ContentRow key={ebook.id} item={ebook} type="ebook" onDelete={handleDeleteEbook} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...documents.slice(0, 6)].map(doc => (
              <div key={doc.id} className="card p-5">
                <h4 className="font-medium text-neutral-900 dark:text-white text-sm mb-3 truncate">{doc.title}</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-primary-600">{formatCount(doc.view_count)}</div>
                    <div className="text-xs text-neutral-500">Views</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-secondary-600">{formatCount(doc.download_count)}</div>
                    <div className="text-xs text-neutral-500">Downloads</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-error-500">{formatCount(doc.like_count)}</div>
                    <div className="text-xs text-neutral-500">Likes</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadDoc && (
        <UploadModal
          open={showUploadDoc}
          onClose={() => setShowUploadDoc(false)}
          onSuccess={() => { setShowUploadDoc(false); loadData(); toast(t('uploadSuccess'), 'success'); }}
          categories={categories}
          type="document"
        />
      )}
      {showUploadEbook && (
        <UploadModal
          open={showUploadEbook}
          onClose={() => setShowUploadEbook(false)}
          onSuccess={() => { setShowUploadEbook(false); loadData(); toast(t('uploadSuccess'), 'success'); }}
          categories={categories}
          type="ebook"
        />
      )}
    </div>
  );
}

function ContentRow({ item, type, onDelete }: { item: Document | Ebook; type: 'document' | 'ebook'; onDelete: (id: string) => void }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center shrink-0">
        {type === 'document' ? <FileText className="w-5 h-5 text-primary-500" /> : <BookOpen className="w-5 h-5 text-accent-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-neutral-900 dark:text-white text-sm truncate">{item.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
          <span className={`badge text-[10px] ${item.status === 'approved' ? 'badge-success' : item.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
            {item.status}
          </span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(item.view_count)}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{formatCount(item.download_count)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => navigate(type === 'document' ? `/documents/${item.id}` : `/ebooks/${item.id}`)} className="btn-ghost btn-sm text-xs">View</button>
        <button onClick={() => onDelete(item.id)} className="btn-ghost btn-sm text-xs text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
