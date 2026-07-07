import { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, BookOpen, Download, DollarSign, Settings,
  CheckCircle, XCircle, Eye, Trash2, Shield, BarChart2,
  Bell, Flag, Tag, Clock, Loader2, Search, RefreshCw,
  TrendingUp, User, ChevronDown, AlertTriangle, Star, CreditCard,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Ebook, Profile, Payment, Report, Category } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { navigate } from '../lib/router';
import { formatDate, timeAgo, formatCount, formatPrice } from '../lib/utils';

type AdminTab = 'overview' | 'users' | 'documents' | 'ebooks' | 'payments' | 'reports' | 'categories' | 'settings' | 'notifications' | 'subscriptions';

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);

  // Data states
  const [users, setUsers] = useState<Profile[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [allDownloads, setAllDownloads] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
  const [pendingEbooks, setPendingEbooks] = useState<Ebook[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ users: 0, documents: 0, ebooks: 0, downloads: 0, pendingPayments: 0, pendingContent: 0 });
  const [settings, setSettings] = useState<Record<string, string>>({});

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameHi, setNewCatNameHi] = useState('');

  // Notification broadcast
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (profile?.role !== 'admin') { toast('Admin access required', 'error'); navigate('/'); return; }
    loadOverview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  useEffect(() => {
    if (activeTab !== 'overview') loadTabData(activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadOverview = async () => {
    setLoading(true);
    const [usersCount, docsCount, ebooksCount, dlCount, pendingPaymentsCount, pendingDocsCount] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('ebooks').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('downloads').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);
    setStats({
      users: usersCount.count ?? 0,
      documents: docsCount.count ?? 0,
      ebooks: ebooksCount.count ?? 0,
      downloads: dlCount.count ?? 0,
      pendingPayments: pendingPaymentsCount.count ?? 0,
      pendingContent: pendingDocsCount.count ?? 0,
    });
    // Load settings
    const { data: settingsData } = await supabase.from('settings').select('*');
    const sMap: Record<string, string> = {};
    (settingsData ?? []).forEach((s: any) => { sMap[s.key] = s.value; });
    setSettings(sMap);
    setLoading(false);
  };

  const loadTabData = async (tab: AdminTab) => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
        setUsers((data as Profile[]) ?? []);
      } else if (tab === 'subscriptions') {
        const [subsRes, dlsRes] = await Promise.all([
          supabase.from('subscriptions').select('*, profile:profiles(full_name, email)').order('created_at', { ascending: false }).limit(100),
          supabase.from('downloads').select('*, document:documents(title), profile:profiles(full_name, email)').order('created_at', { ascending: false }).limit(100),
        ]);
        setAllSubscriptions(subsRes.data ?? []);
        setAllDownloads(dlsRes.data ?? []);
      } else if (tab === 'documents') {
        const { data } = await supabase
          .from('documents')
          .select('*, category:categories(name), uploader:profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(50);
        setPendingDocs((data as Document[]) ?? []);
      } else if (tab === 'ebooks') {
        const { data } = await supabase
          .from('ebooks')
          .select('*, category:categories(name), uploader:profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(50);
        setPendingEbooks((data as Ebook[]) ?? []);
      } else if (tab === 'payments') {
        const { data } = await supabase
          .from('payments')
          .select('*, user:profiles(full_name, email)')
          .order('created_at', { ascending: false });
        setPayments((data as Payment[]) ?? []);
      } else if (tab === 'reports') {
        const { data } = await supabase
          .from('reports')
          .select('*, reporter:profiles(full_name)')
          .order('created_at', { ascending: false });
        setReports((data as Report[]) ?? []);
      } else if (tab === 'categories') {
        const { data } = await supabase.from('categories').select('*').order('sort_order');
        setCategories((data as Category[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoc = async (id: string) => {
    const { error } = await supabase.from('documents').update({ status: 'approved', is_approved: true }).eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    setPendingDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'approved', is_approved: true } : d));
    toast('Document approved!', 'success');
  };

  const handleRejectDoc = async (id: string) => {
    const { error } = await supabase.from('documents').update({ status: 'rejected', is_approved: false }).eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    setPendingDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected' } : d));
    toast('Document rejected', 'info');
  };

  const handleApproveEbook = async (id: string) => {
    await supabase.from('ebooks').update({ status: 'approved', is_approved: true }).eq('id', id);
    setPendingEbooks(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', is_approved: true } : e));
    toast('E-Book approved!', 'success');
  };

  const handleRejectEbook = async (id: string) => {
    await supabase.from('ebooks').update({ status: 'rejected', is_approved: false }).eq('id', id);
    setPendingEbooks(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
    toast('E-Book rejected', 'info');
  };

  const handleApprovePayment = async (payment: Payment) => {
    const { error } = await supabase
      .from('payments')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', payment.id);
    if (error) { toast(error.message, 'error'); return; }

    // Create/update subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await supabase.from('subscriptions').upsert({
      user_id: payment.user_id,
      plan: payment.plan,
      status: 'active',
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'user_id' });

    // Update profile role
    const newRole = 'premium_user';
    await supabase.from('profiles').update({ role: newRole }).eq('id', payment.user_id);

    // Send notification
    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: 'Subscription Activated!',
      message: `Your ${payment.plan} plan is now active. Enjoy unlimited access!`,
      type: 'subscription',
    });

    setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'approved' } : p));
    toast('Payment approved! Subscription activated.', 'success');
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Reason for rejection (optional):') ?? '';
    await supabase.from('payments').update({
      status: 'rejected',
      admin_note: reason,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', paymentId);
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected' } : p));
    toast('Payment rejected', 'info');
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as any } : u));
    toast('Role updated', 'success');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user account? This cannot be undone.')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast('User deleted', 'success');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const { error } = await supabase.from('categories').insert({
      name: newCatName.trim(),
      name_hi: newCatNameHi.trim() || newCatName.trim(),
      slug,
    });
    if (error) { toast(error.message, 'error'); return; }
    setNewCatName(''); setNewCatNameHi('');
    loadTabData('categories');
    toast('Category added!', 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    toast('Category deleted', 'success');
  };

  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    const { data: userIds } = await supabase.from('profiles').select('id');
    if (!userIds) { toast('No users found', 'error'); return; }

    const notifications = userIds.map((u: any) => ({
      user_id: u.id,
      title: notifTitle.trim(),
      message: notifMessage.trim(),
      type: 'info',
    }));

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) { toast(error.message, 'error'); return; }
    setNotifTitle(''); setNotifMessage('');
    toast(`Notification sent to ${userIds.length} users!`, 'success');
  };

  const handleSaveSetting = async (key: string, value: string) => {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
    setSettings(prev => ({ ...prev, [key]: value }));
    toast('Setting saved', 'success');
  };

  if (!user || profile?.role !== 'admin') return null;

  const adminTabs = [
    { id: 'overview' as AdminTab, label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'users' as AdminTab, label: t('userManagement'), icon: <Users className="w-4 h-4" /> },
    { id: 'subscriptions' as AdminTab, label: 'Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'documents' as AdminTab, label: 'Documents', icon: <FileText className="w-4 h-4" />, badge: stats.pendingContent },
    { id: 'ebooks' as AdminTab, label: 'E-Books', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'payments' as AdminTab, label: t('paymentVerification'), icon: <DollarSign className="w-4 h-4" />, badge: stats.pendingPayments },
    { id: 'reports' as AdminTab, label: t('reportsManagement'), icon: <Flag className="w-4 h-4" /> },
    { id: 'categories' as AdminTab, label: t('categoryManagement'), icon: <Tag className="w-4 h-4" /> },
    { id: 'notifications' as AdminTab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings' as AdminTab, label: t('siteSettings'), icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pt-20">
      <div className="page-container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white">{t('adminPanel')}</h1>
            <p className="text-sm text-neutral-500">Manage platform content and users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar nav */}
          <div className="lg:col-span-1">
            <nav className="card overflow-hidden">
              {adminTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 border-r-2 border-primary-500'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="truncate text-xs md:text-sm">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-auto badge bg-error-100 text-error-600 text-[10px] shrink-0">{tab.badge}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-4">
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: <Users />, label: t('totalUsers'), value: stats.users, color: 'primary' },
                    { icon: <FileText />, label: t('totalDocuments'), value: stats.documents, color: 'secondary' },
                    { icon: <BookOpen />, label: t('totalEbooks'), value: stats.ebooks, color: 'accent' },
                    { icon: <Download />, label: t('totalDownloads'), value: formatCount(stats.downloads), color: 'success' },
                    { icon: <DollarSign />, label: t('pendingPayments'), value: stats.pendingPayments, color: 'warning', urgent: stats.pendingPayments > 0 },
                    { icon: <Clock />, label: t('pendingApprovals'), value: stats.pendingContent, color: 'warning', urgent: stats.pendingContent > 0 },
                  ].map(({ icon, label, value, color, urgent }) => (
                    <div key={label} className={`card p-5 ${urgent ? 'border-warning-300 dark:border-warning-700' : ''}`}>
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${
                        color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' :
                        color === 'secondary' ? 'bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600' :
                        color === 'accent' ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-600' :
                        color === 'success' ? 'bg-success-50 dark:bg-success-900/30 text-success-600' :
                        'bg-warning-50 dark:bg-warning-900/30 text-warning-600'
                      }`}>
                        {icon}
                      </div>
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-neutral-900 dark:text-white">{t('userManagement')} ({users.length})</h2>
                  <button onClick={() => loadTabData('users')} className="btn-ghost btn-sm"><RefreshCw className="w-4 h-4" /></button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Role</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Joined</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-primary-600">{u.full_name?.slice(0, 1) ?? 'U'}</span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-neutral-900 dark:text-white">{u.full_name}</div>
                                    <div className="text-xs text-neutral-400 truncate max-w-40">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={u.role}
                                  onChange={e => handleUpdateRole(u.id, e.target.value)}
                                  className="text-xs border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                                >
                                  <option value="free_user">Free User</option>
                                  <option value="premium_user">Premium User</option>
                                  <option value="creator">Creator</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-xs text-neutral-500">{formatDate(u.created_at)}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleDeleteUser(u.id)} className="btn-ghost btn-sm text-error-500 hover:bg-error-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents tab */}
            {activeTab === 'documents' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">Content Moderation — Documents</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="space-y-3">
                    {pendingDocs.filter(d => d.status === 'pending').map(doc => (
                      <ContentApprovalRow
                        key={doc.id}
                        item={doc}
                        onApprove={() => handleApproveDoc(doc.id)}
                        onReject={() => handleRejectDoc(doc.id)}
                        onView={() => navigate(`/documents/${doc.id}`)}
                      />
                    ))}
                    {pendingDocs.filter(d => d.status !== 'pending').map(doc => (
                      <ApprovedContentRow key={doc.id} item={doc} type="document" onToggleDownload={async () => {
                        const newVal = !doc.is_downloadable;
                        await supabase.from('documents').update({ is_downloadable: newVal }).eq('id', doc.id);
                        setApprovedDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_downloadable: newVal } : d));
                      }} onDelete={async () => {
                        await supabase.from('documents').delete().eq('id', doc.id);
                        setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
                        toast('Deleted', 'success');
                      }} />
                    ))}
                    {pendingDocs.length === 0 && (
                      <div className="card p-10 text-center">
                        <CheckCircle className="w-10 h-10 text-success-500 mx-auto mb-3" />
                        <p className="text-neutral-500">No documents to review</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ebooks tab */}
            {activeTab === 'ebooks' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">Content Moderation — E-Books</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="space-y-3">
                    {pendingEbooks.filter(e => e.status === 'pending').map(ebook => (
                      <ContentApprovalRow
                        key={ebook.id}
                        item={ebook}
                        onApprove={() => handleApproveEbook(ebook.id)}
                        onReject={() => handleRejectEbook(ebook.id)}
                        onView={() => navigate(`/ebooks/${ebook.id}`)}
                      />
                    ))}
                    {pendingEbooks.length === 0 && (
                      <div className="card p-10 text-center">
                        <CheckCircle className="w-10 h-10 text-success-500 mx-auto mb-3" />
                        <p className="text-neutral-500">No e-books to review</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payments tab */}
            {activeTab === 'payments' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">{t('paymentVerification')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="space-y-4">
                    {payments.length === 0 && (
                      <div className="card p-10 text-center">
                        <DollarSign className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500">No payments to review</p>
                      </div>
                    )}
                    {payments.map(payment => (
                      <div key={payment.id} className={`card p-5 ${payment.status === 'pending' ? 'border-warning-300 dark:border-warning-700' : ''}`}>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`badge ${payment.status === 'approved' ? 'badge-success' : payment.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                {payment.status}
                              </span>
                              <span className="badge-primary capitalize">{payment.plan} Plan</span>
                            </div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{payment.user?.full_name}</p>
                            <p className="text-sm text-neutral-500">{payment.user?.email}</p>
                            <p className="text-sm text-neutral-500 mt-1">Amount: ₹{payment.amount} • {timeAgo(payment.created_at)}</p>
                            {payment.upi_transaction_id && (
                              <p className="text-xs text-neutral-400 mt-1">Txn ID: {payment.upi_transaction_id}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {payment.screenshot_url && (
                              <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                                <Eye className="w-3.5 h-3.5" /> View Screenshot
                              </a>
                            )}
                            {payment.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleApprovePayment(payment)} className="btn-primary btn-sm">
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button onClick={() => handleRejectPayment(payment.id)} className="btn-danger btn-sm">
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Reports tab */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">{t('reportsManagement')}</h2>
                {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
                ) : reports.length === 0 ? (
                  <div className="card p-10 text-center">
                    <Flag className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">No reports submitted</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map(r => (
                      <div key={r.id} className="card p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${r.status === 'pending' ? 'badge-warning' : 'badge-success'} text-xs`}>{r.status}</span>
                            <span className="text-xs text-neutral-500">{r.reason}</span>
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{r.description || 'No description'}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">Reported by {r.reporter?.full_name} • {timeAgo(r.created_at)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'resolved' }).eq('id', r.id);
                            setReports(prev => prev.map(rep => rep.id === r.id ? { ...rep, status: 'resolved' } : rep));
                            toast('Marked as resolved', 'success');
                          }} className="btn-ghost btn-sm text-xs">Resolve</button>
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id);
                            setReports(prev => prev.map(rep => rep.id === r.id ? { ...rep, status: 'dismissed' } : rep));
                          }} className="btn-ghost btn-sm text-xs">Dismiss</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categories tab */}
            {activeTab === 'categories' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">{t('categoryManagement')}</h2>
                <div className="card p-5 mb-5">
                  <h3 className="font-semibold text-neutral-800 dark:text-white mb-3">Add New Category</h3>
                  <form onSubmit={handleAddCategory} className="flex flex-wrap gap-3">
                    <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name (English)" className="input flex-1 min-w-48" />
                    <input type="text" value={newCatNameHi} onChange={e => setNewCatNameHi(e.target.value)} placeholder="Category name (Hindi)" className="input flex-1 min-w-48" />
                    <button type="submit" className="btn-primary">Add Category</button>
                  </form>
                </div>
                {loading ? (
                  <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-primary-600" /></div>
                ) : (
                  <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-100 dark:border-neutral-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Hindi</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {categories.map(cat => (
                          <tr key={cat.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">{cat.name}</td>
                            <td className="px-4 py-3 text-neutral-500">{cat.name_hi}</td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleDeleteCategory(cat.id)} className="btn-ghost btn-sm text-error-500 hover:bg-error-50">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Notifications tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">Broadcast Notification</h2>
                <div className="card p-6">
                  <form onSubmit={handleBroadcastNotification} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Title</label>
                      <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="input" placeholder="Notification title" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Message</label>
                      <textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={4} className="input resize-none" placeholder="Notification message..." required />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-neutral-500">This will be sent to ALL users</p>
                      <button type="submit" className="btn-primary">
                        <Bell className="w-4 h-4" /> Send to All Users
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Settings tab */}
            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div>
                <h2 className="font-bold text-lg font-heading text-neutral-900 dark:text-white mb-5">User Subscriptions & Download History</h2>

                {/* Subscriptions */}
                <div className="card overflow-hidden mb-6">
                  <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">All Subscriptions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                        <tr>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">User</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Plan</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Status</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Starts</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSubscriptions.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-neutral-400">No subscriptions found</td></tr>
                        ) : allSubscriptions.map((sub) => (
                          <tr key={sub.id} className="border-t border-neutral-100 dark:border-neutral-800">
                            <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">{sub.profile?.full_name ?? 'Unknown'}</td>
                            <td className="px-5 py-3">
                              <span className={`badge ${sub.plan === 'premium' ? 'badge-warning' : sub.plan === 'pro' ? 'badge-info' : 'badge-neutral'} capitalize`}>{sub.plan}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`badge ${sub.status === 'active' ? 'badge-success' : 'badge-error'}`}>{sub.status}</span>
                            </td>
                            <td className="px-5 py-3 text-neutral-500">{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '—'}</td>
                            <td className="px-5 py-3 text-neutral-500">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Download History */}
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Download History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                        <tr>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">User</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Document</th>
                          <th className="text-left px-5 py-3 font-medium text-neutral-500">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allDownloads.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-8 text-neutral-400">No downloads yet</td></tr>
                        ) : allDownloads.map((dl) => (
                          <tr key={dl.id} className="border-t border-neutral-100 dark:border-neutral-800">
                            <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">{dl.profile?.full_name ?? 'Unknown'}</td>
                            <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">{dl.document?.title ?? 'Unknown'}</td>
                            <td className="px-5 py-3 text-neutral-500">{dl.created_at ? new Date(dl.created_at).toLocaleString() : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-white mb-4">{t('siteSettings')}</h2>
                <div className="card p-6 space-y-5">
                  {[
                    { key: 'upi_id', label: 'UPI ID', type: 'text' },
                    { key: 'pro_price', label: 'Pro Plan Price (₹)', type: 'number' },
                    { key: 'premium_price', label: 'Premium Plan Price (₹/month)', type: 'number' },
                    { key: 'free_trial_days', label: 'Free Trial Duration (days)', type: 'number' },
                    { key: 'free_downloads_per_day', label: 'Free Downloads Per Day', type: 'number' },
                    { key: 'downloads_enabled', label: 'Global Downloads Enabled (true/false)', type: 'text' },
                    { key: 'site_name', label: 'Site Name', type: 'text' },
                    { key: 'maintenance_mode', label: 'Maintenance Mode (true/false)', type: 'text' },
                    { key: 'auto_approve_uploads', label: 'Auto Approve Uploads (true/false)', type: 'text' },
                  ].map(({ key, label, type }) => (
                    <div key={key} className="flex items-center gap-4">
                      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 w-64 shrink-0">{label}</label>
                      <input
                        type={type}
                        defaultValue={settings[key] ?? ''}
                        onBlur={e => handleSaveSetting(key, e.target.value)}
                        className="input flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContentApprovalRow({ item, onApprove, onReject, onView }: { item: Document | Ebook; onApprove: () => void; onReject: () => void; onView: () => void }) {
  return (
    <div className="card p-4 border-l-4 border-warning-400">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 dark:text-white truncate">{item.title}</h3>
          <p className="text-xs text-neutral-400 mt-1">
            {(item as any).uploader?.full_name} • {timeAgo(item.created_at)}
            {(item as any).category && ` • ${(item as any).category.name}`}
          </p>
          {item.description && <p className="text-sm text-neutral-500 mt-1.5 line-clamp-2">{item.description}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={onView} className="btn-ghost btn-sm text-xs"><Eye className="w-3.5 h-3.5" /></button>
          <button onClick={onApprove} className="btn-primary btn-sm text-xs">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button onClick={onReject} className="btn-danger btn-sm text-xs">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovedContentRow({ item, type, onDelete, onToggleDownload }: { item: Document | Ebook; type: string; onDelete: () => void; onToggleDownload?: () => void }) {
  return (
    <div className="card p-4 opacity-70">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`badge text-xs ${item.status === 'approved' ? 'badge-success' : 'badge-error'}`}>{item.status}</span>
          <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {type === 'document' && onToggleDownload && (
            <button
              onClick={onToggleDownload}
              className={`btn-sm btn-ghost ${(item as Document).is_downloadable ? 'text-success-600' : 'text-neutral-400'}`}
              title={(item as Document).is_downloadable ? 'Downloads enabled' : 'Downloads disabled'}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onDelete} className="btn-ghost btn-sm text-error-500 hover:bg-error-50 shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
