import { useState, useEffect } from 'react';
import {
  User, Upload, Download, Bookmark, History, Settings, Bell,
  Zap, Edit2, Save, X, Camera, CheckCircle, Loader2,
  FileText, BookOpen, Heart, Calendar, Award, Clock, Lock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Ebook, Download as DownloadType, Notification, Subscription } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { navigate, useQueryParams } from '../lib/router';
import { formatDate, timeAgo, formatCount } from '../lib/utils';
import DocumentCard from '../components/documents/DocumentCard';

type Tab = 'profile' | 'uploads' | 'downloads' | 'saved' | 'history' | 'subscription' | 'settings' | 'notifications';

export default function UserDashboard() {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();
  const params = useQueryParams();

  const [activeTab, setActiveTab] = useState<Tab>((params.get('tab') as Tab) ?? 'profile');
  const [uploads, setUploads] = useState<Document[]>([]);
  const [downloads, setDownloads] = useState<DownloadType[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadTabData(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setBio(profile?.bio ?? '');
  }, [profile]);

  const loadTabData = async (tab: Tab) => {
    if (!user) return;
    setLoading(true);
    try {
      if (tab === 'uploads') {
        const { data } = await supabase
          .from('documents')
          .select('*, category:categories(name, color)')
          .eq('uploader_id', user.id)
          .order('created_at', { ascending: false });
        setUploads((data as Document[]) ?? []);
      } else if (tab === 'downloads') {
        const { data } = await supabase
          .from('downloads')
          .select('*, document:documents(id, title, file_type, category:categories(name)), ebook:ebooks(id, title, file_type)')
          .eq('user_id', user.id)
          .order('downloaded_at', { ascending: false })
          .limit(50);
        setDownloads((data as DownloadType[]) ?? []);
      } else if (tab === 'saved') {
        const { data } = await supabase
          .from('bookmarks')
          .select('*, document:documents(id, title, file_type, download_count, view_count, like_count, is_premium, category:categories(name, color)), ebook:ebooks(id, title, author, cover_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setSaved((data as any[]) ?? []);
      } else if (tab === 'notifications') {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30);
        setNotifications((data as Notification[]) ?? []);
        // Mark all as read
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      } else if (tab === 'subscription') {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setSubscription(data as Subscription);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName, bio });
    if (error) { toast(error, 'error'); }
    else { toast('Profile updated!', 'success'); setEditing(false); }
    setSaving(false);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) { toast(error.message, 'error'); return; }
    setUploads(prev => prev.filter(d => d.id !== docId));
    toast('Document deleted', 'success');
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setSaved(prev => prev.filter(b => b.id !== bookmarkId));
    toast('Removed from saved', 'info');
  };

  if (!user || !profile) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'profile', label: t('profile'), icon: <User className="w-4 h-4" /> },
    { id: 'uploads', label: t('myUploads'), icon: <Upload className="w-4 h-4" /> },
    { id: 'downloads', label: t('myDownloads'), icon: <Download className="w-4 h-4" /> },
    { id: 'saved', label: t('savedDocs'), icon: <Bookmark className="w-4 h-4" /> },
    { id: 'notifications', label: t('notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'subscription', label: 'Subscription', icon: <Zap className="w-4 h-4" /> },
    { id: 'settings', label: t('settings'), icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-5 mb-4">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-4 border-primary-200 dark:border-primary-800">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    ) : (
                      <span className="text-2xl font-bold text-primary-600">
                        {profile.full_name?.slice(0, 1).toUpperCase() ?? 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <h2 className="font-bold text-neutral-900 dark:text-white">{profile.full_name}</h2>
                <p className="text-sm text-neutral-500 truncate w-full">{profile.email}</p>
                <span className="badge-primary text-xs mt-1.5 capitalize">{profile.role.replace('_', ' ')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">{uploads.length || '—'}</div>
                  <div className="text-xs text-neutral-500">Uploads</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">{downloads.length || '—'}</div>
                  <div className="text-xs text-neutral-500">Downloads</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-white">{saved.length || '—'}</div>
                  <div className="text-xs text-neutral-500">Saved</div>
                </div>
              </div>
            </div>

            <nav className="card overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); navigate(`/dashboard?tab=${tab.id}`); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 border-r-2 border-primary-500'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count && tab.count > 0 && (
                    <span className="ml-auto badge bg-error-100 text-error-600 text-xs">{tab.count}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white">{t('profile')}</h2>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="btn-secondary btn-sm">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(false)} className="btn-ghost btn-sm"><X className="w-3.5 h-3.5" /></button>
                      <button onClick={handleSaveProfile} disabled={saving} className="btn-primary btn-sm">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Full Name</label>
                    {editing ? (
                      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
                    ) : (
                      <p className="text-neutral-900 dark:text-white">{profile.full_name || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
                    <p className="text-neutral-900 dark:text-white">{profile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Bio</label>
                    {editing ? (
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input resize-none" placeholder="Tell us about yourself..." />
                    ) : (
                      <p className="text-neutral-600 dark:text-neutral-400">{profile.bio || 'No bio added yet.'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Account Type</label>
                    <span className="badge-primary capitalize">{profile.role.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Member Since</label>
                    <p className="text-neutral-600 dark:text-neutral-400">{formatDate(profile.created_at)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Uploads Tab */}
            {activeTab === 'uploads' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">{t('myUploads')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : uploads.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Upload className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No uploads yet. Start sharing your knowledge!</p>
                    <a href="#/creator" className="btn-primary btn-sm mt-4">Upload Document</a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploads.map(doc => (
                      <div key={doc.id} className="card p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-neutral-900 dark:text-white text-sm truncate">{doc.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`badge text-[10px] ${doc.status === 'approved' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                              {doc.status}
                            </span>
                            {doc.category && <span className="text-xs text-neutral-400">{doc.category.name}</span>}
                            <span className="text-xs text-neutral-400">{formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-400 shrink-0">
                          <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {doc.download_count}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {doc.like_count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/documents/${doc.id}`)} className="btn-ghost btn-sm text-xs">View</button>
                          <button onClick={() => handleDeleteDoc(doc.id)} className="btn-ghost btn-sm text-xs text-error-500 hover:bg-error-50">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Downloads Tab */}
            {activeTab === 'downloads' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">{t('myDownloads')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : downloads.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Download className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No downloads yet.</p>
                    <a href="#/documents" className="btn-primary btn-sm mt-4">Browse Documents</a>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {downloads.map(dl => {
                      const item = dl.document ?? dl.ebook;
                      if (!item) return null;
                      return (
                        <div key={dl.id} className="card p-4 flex items-center gap-4">
                          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center shrink-0">
                            {dl.document ? <FileText className="w-5 h-5 text-primary-500" /> : <BookOpen className="w-5 h-5 text-accent-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-neutral-900 dark:text-white text-sm truncate">{(item as any).title}</h3>
                            <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(dl.downloaded_at)}</p>
                          </div>
                          <button
                            onClick={() => navigate(dl.document ? `/documents/${dl.document_id}` : `/ebooks/${dl.ebook_id}`)}
                            className="btn-secondary btn-sm shrink-0"
                          >
                            View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">{t('savedDocs')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : saved.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Bookmark className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No saved items yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {saved.map(bm => (
                      <div key={bm.id} className="card p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center shrink-0">
                          {bm.document ? <FileText className="w-5 h-5 text-primary-500" /> : <BookOpen className="w-5 h-5 text-accent-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {bm.document?.title ?? bm.ebook?.title}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">{timeAgo(bm.created_at)}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => navigate(bm.document ? `/documents/${bm.document_id}` : `/ebooks/${bm.ebook_id}`)}
                            className="btn-ghost btn-sm text-xs"
                          >View</button>
                          <button onClick={() => handleRemoveBookmark(bm.id)} className="btn-ghost btn-sm text-xs text-error-500">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">{t('notifications')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : notifications.length === 0 ? (
                  <div className="card p-12 text-center">
                    <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`card p-4 flex items-start gap-3 ${!n.is_read ? 'border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-950/20' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          n.type === 'success' || n.type === 'approval' ? 'bg-success-500' :
                          n.type === 'error' ? 'bg-error-500' :
                          n.type === 'warning' ? 'bg-warning-500' : 'bg-primary-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{n.message}</p>
                          <p className="text-xs text-neutral-400 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">Subscription</h2>
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{t('currentPlan')}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-primary-600 capitalize">{subscription?.plan ?? 'Free'}</span>
                        <span className={`badge ${subscription?.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {subscription?.status ?? 'Free'}
                        </span>
                      </div>
                    </div>
                    {(!subscription || subscription.plan === 'free') && (
                      <a href="#/pricing" className="btn-primary">
                        <Zap className="w-4 h-4" /> Upgrade
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Trial Days Remaining */}
                    <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary-600" />
                        <span className="text-xs font-medium text-neutral-500">Trial Days Remaining</span>
                      </div>
                      <p className="text-2xl font-bold text-primary-600">
                        {subscription?.plan === 'free' && subscription?.expires_at
                          ? (() => {
                              const days = Math.max(0, Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                              return days > 0 ? `${days} days` : 'Expired';
                            })()
                          : '—'}
                      </p>
                    </div>

                    {/* Subscription Expiry Date */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span className="text-xs font-medium text-neutral-500">Expiry Date</span>
                      </div>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">
                        {subscription?.expires_at ? formatDate(subscription.expires_at) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Download Access Status */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-neutral-500" />
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Download Access Status</span>
                      </div>
                      {(() => {
                        const isActive = subscription?.status === 'active' && (!subscription?.expires_at || new Date(subscription.expires_at) > new Date());
                        return isActive ? (
                          <span className="badge badge-success flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="badge badge-error flex items-center gap-1">
                            <Lock className="w-3 h-3" /> No Access
                          </span>
                        );
                      })()}
                    </div>
                    {!subscription?.expires_at || new Date(subscription.expires_at) <= new Date() ? (
                      <p className="text-xs text-neutral-500 mt-2">
                        Your download access has expired. <a href="#/pricing" className="text-primary-600 font-medium">Upgrade now</a> to regain access.
                      </p>
                    ) : (
                      <p className="text-xs text-neutral-500 mt-2">
                        You can download documents. {subscription?.plan === 'free' ? 'Free trial includes non-premium documents.' : 'All documents included.'}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                    <h4 className="font-medium text-neutral-800 dark:text-white mb-3">Daily Downloads</h4>
                    <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      <span>{profile.downloads_today} used today</span>
                      <span>{subscription?.plan !== 'free' ? '∞ unlimited' : '1 max'}</span>
                    </div>
                    {subscription?.plan === 'free' && (
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (profile.downloads_today / 1) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="card p-6">
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-6">{t('settings')}</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">Email Notifications</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">Receive email for uploads, approvals, and subscriptions</p>
                    </div>
                    <div className="w-11 h-6 bg-primary-600 rounded-full relative cursor-pointer">
                      <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">Language</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">Platform display language</p>
                    </div>
                    <a href="#/dashboard" onClick={e => { e.preventDefault(); }} className="btn-secondary btn-sm">
                      Change in Header
                    </a>
                  </div>
                  <div className="pt-4">
                    <h3 className="font-medium text-error-600 mb-2">Danger Zone</h3>
                    <button
                      onClick={() => { if (confirm('Delete your account? This cannot be undone.')) { /* handle */ } }}
                      className="btn-danger btn-sm"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
