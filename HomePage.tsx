import { useState, useEffect } from 'react';
import {
  Search, Star, ChevronRight, ArrowRight,
  Users, FileText, Download, BookOpen, Shield, Zap, Award,
  CheckCircle, ChevronDown, Play, Sparkles, Globe,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Document, Ebook, PRICING_PLANS } from '../lib/types';
import { navigate } from '../lib/router';
import { useLang } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatCount, formatPrice } from '../lib/utils';
import DocumentCard from '../components/documents/DocumentCard';
import EbookCard from '../components/ebooks/EbookCard';

export default function HomePage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [stats, setStats] = useState({ users: 0, documents: 0, ebooks: 0, downloads: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('documents').select('*, category:categories(*), uploader:profiles(full_name, avatar_url)').eq('is_approved', true).order('created_at', { ascending: false }).limit(8),
      supabase.from('ebooks').select('*, category:categories(*)').eq('is_approved', true).order('created_at', { ascending: false }).limit(6),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('documents').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('ebooks').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('downloads').select('id', { count: 'exact', head: true }),
    ]).then(([docsRes, ebooksRes, usersCount, docsCount, ebooksCount, dlCount]) => {
      setDocuments((docsRes.data as Document[]) ?? []);
      setEbooks((ebooksRes.data as Ebook[]) ?? []);
      setStats({
        users: usersCount.count ?? 0,
        documents: docsCount.count ?? 0,
        ebooks: ebooksCount.count ?? 0,
        downloads: dlCount.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
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

  const popularSearches = ['Nursing Notes', 'B.Sc Nursing', 'Previous Year Papers', 'Medical Notes', 'GNM Study Material', 'AIIMS Question Paper'];

  const testimonials = [
    { name: 'Priya Sharma', role: 'B.Sc Nursing Student', text: 'Knowlix helped me score top marks! The study materials here are absolutely amazing.', avatar: 'P', rating: 5 },
    { name: 'Rahul Verma', role: 'Medical Student, AIIMS', text: 'Best platform for medical study materials. I found all my previous year papers here.', avatar: 'R', rating: 5 },
    { name: 'Sunita Patel', role: 'ANM Nursing Student', text: 'The quality of content on Knowlix is unmatched. Highly recommend to all students!', avatar: 'S', rating: 5 },
    { name: 'Amit Kumar', role: 'GNM Student', text: 'Downloaded hundreds of notes and e-books. Best investment was getting the Pro plan!', avatar: 'A', rating: 5 },
  ];

  const faqs = [
    { q: 'How do I download documents?', a: 'Free trial users can download 1 document per day for 2 days. Upgrade to Premium plan for unlimited downloads. Simply click the Download button on any document page.' },
    { q: 'How do I subscribe to a paid plan?', a: 'Go to our Pricing page, select a plan, pay via UPI using the provided UPI ID, upload your payment screenshot, and wait for admin approval (usually within a few hours).' },
    { q: 'Can I upload my own documents?', a: 'Yes! Create an account, go to your Creator Dashboard, and upload your documents. All uploads are reviewed by our admin team before going live to ensure quality.' },
    { q: 'Is the content authentic and accurate?', a: 'All documents are reviewed by our moderation team before approval. We have strict quality control measures in place to ensure the accuracy and authenticity of all content.' },
    { q: 'What file formats are supported?', a: 'We support PDF, DOCX, PPT, PPTX, and TXT for documents. For e-books, we support PDF and EPUB formats.' },
    { q: 'How does the refund policy work?', a: 'We offer refunds within 7 days of payment if the subscription has not been used. Please contact our support team with your payment details for refund requests.' },
  ];

  const featureHighlights = [
    { icon: Shield, title: 'Verified Content', desc: 'All materials are reviewed and verified by experts before publication.' },
    { icon: Zap, title: 'Instant Access', desc: 'Download or read online instantly. No waiting, no hassle.' },
    { icon: Globe, title: 'Bilingual Platform', desc: 'Full support for Hindi and English languages throughout the platform.' },
    { icon: Sparkles, title: 'AI-Powered Tools', desc: 'AI summaries, keyword extraction, and smart study suggestions.' },
  ];

  return (
    <div>
      {/* ======== HERO ======== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent-900">
        {/* Background */}
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-accent-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

        <div className="page-container relative z-10 py-20 w-full">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/80">India's #1 Educational Document Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading text-white leading-tight mb-6">
              {t('heroTitle').split(' ').slice(0, 1).join(' ')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-300">
                {t('heroTitle').split(' ').slice(1, 2).join(' ')}
              </span>{' '}
              {t('heroTitle').split(' ').slice(2).join(' ')}
            </h1>

            <p className="text-lg md:text-xl text-primary-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
              <div className="flex items-center bg-white dark:bg-neutral-900 rounded-2xl shadow-elevated p-2 gap-2">
                <Search className="w-5 h-5 text-neutral-400 ml-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('heroSearch')}
                  className="flex-1 py-2 px-2 text-neutral-900 dark:text-white bg-transparent border-none outline-none text-base placeholder-neutral-400"
                />
                <button type="submit" className="btn-primary rounded-xl px-5 py-2.5 shrink-0">
                  {t('search')}
                </button>
              </div>
            </form>

            {/* Popular searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              <span className="text-xs text-white/50 mr-1">Popular:</span>
              {popularSearches.map(term => (
                <button
                  key={term}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(term)}`)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white/80 rounded-full px-3 py-1.5 transition-colors border border-white/10"
                >
                  {term}
                </button>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#/documents" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                <BookOpen className="w-5 h-5" />
                {t('browseAll')}
              </a>
              {!user && (
                <a href="#/auth?mode=signup" className="btn border-2 border-white/30 text-white hover:bg-white/10 btn-lg">
                  <Play className="w-4 h-4" />
                  {t('getStarted')}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/40" />
        </div>
      </section>

      {/* ======== STATS ======== */}
      <section className="py-12 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="page-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: stats.users, label: 'Active Students', color: 'text-primary-600' },
              { icon: FileText, value: stats.documents, label: 'Study Documents', color: 'text-secondary-600' },
              { icon: BookOpen, value: stats.ebooks, label: 'E-Books', color: 'text-accent-600' },
              { icon: Download, value: stats.downloads, label: 'Total Downloads', color: 'text-success-600' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-50 dark:bg-neutral-800 mb-3 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-2xl md:text-3xl font-bold font-heading text-neutral-900 dark:text-white">
                  {formatCount(value)}+
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== ALL FILES ======== */}
      {documents.length > 0 && (
        <section className="py-16 bg-neutral-50 dark:bg-neutral-950">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title">{t('featuredDocs')}</h2>
                <p className="section-subtitle">Browse all study materials — no category needed</p>
              </div>
              <a href="#/documents" className="btn-secondary hidden sm:flex">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : documents.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onView={() => navigate(`/documents/${doc.id}`)}
                    onLike={() => handleDocLike(doc.id, !!doc.user_liked)}
                    onBookmark={() => handleDocBookmark(doc.id, !!doc.user_bookmarked)}
                    onDownload={() => navigate(`/documents/${doc.id}`)}
                  />
                ))}
            </div>
            <div className="text-center mt-8">
              <a href="#/documents" className="btn-primary btn-lg">
                {t('viewAll')} Documents <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ======== FEATURED EBOOKS ======== */}
      {ebooks.length > 0 && (
        <section className="py-16 bg-white dark:bg-neutral-900">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title">{t('featuredEbooks')}</h2>
                <p className="section-subtitle">Read online or download to your device</p>
              </div>
              <a href="#/ebooks" className="btn-secondary hidden sm:flex">
                {t('viewAll')} <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
              {ebooks.slice(0, 6).map(ebook => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ======== WHY KNOWLIX ======== */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-950/50 dark:to-accent-950/50">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Choose Knowlix?</h2>
            <p className="section-subtitle">Built for students, by students</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureHighlights.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold font-heading text-neutral-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== TESTIMONIALS ======== */}
      <section className="py-16 bg-white dark:bg-neutral-900">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="section-title">{t('testimonials')}</h2>
            <p className="section-subtitle">Join thousands of satisfied students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="card p-6 hover:shadow-elevated transition-all hover:-translate-y-1">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 italic mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-white">{t.name}</div>
                    <div className="text-xs text-neutral-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== PRICING ======== */}
      <section id="pricing" className="py-16 bg-neutral-50 dark:bg-neutral-950">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title">{t('pricingPlans')}</h2>
            <p className="section-subtitle">Start free, upgrade when you need more</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`card p-7 relative transition-all hover:-translate-y-1 ${
                  plan.highlighted
                    ? 'border-primary-400 dark:border-primary-600 shadow-primary ring-2 ring-primary-400/30'
                    : 'hover:shadow-elevated'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-primary-600 text-white text-xs px-3 py-1">Most Popular</span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${
                    plan.highlighted ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}>
                    {plan.id === 'free' ? <Shield className="w-6 h-6 text-neutral-600 dark:text-neutral-400" /> :
                     plan.id === 'pro' ? <Zap className="w-6 h-6 text-primary-600" /> :
                     <Award className="w-6 h-6 text-accent-600" />}
                  </div>
                  <h3 className="text-xl font-bold font-heading text-neutral-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                      {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-neutral-500 text-sm mb-1">/{plan.period}</span>}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-700 dark:text-neutral-300">
                      <CheckCircle className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  user ? (
                    <div className="btn-ghost btn-lg w-full cursor-default opacity-50">Current Plan</div>
                  ) : (
                    <a href="#/auth?mode=signup" className="btn-secondary btn-lg w-full">{t('getStarted')}</a>
                  )
                ) : (
                  <a href="#/pricing" className={`btn-lg w-full ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}>
                    {plan.id === 'pro' ? t('getProPlan') : t('getPremiumPlan')}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== FAQ ======== */}
      <section className="py-16 bg-white dark:bg-neutral-900">
        <div className="page-container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="section-title">{t('faq')}</h2>
            <p className="section-subtitle">Everything you need to know</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="font-medium text-neutral-900 dark:text-white text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-4">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== CTA ======== */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
          <div className="page-container text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
              Join over {formatCount(stats.users)}+ students already using Knowlix. Free forever, upgrade when ready.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="#/auth?mode=signup" className="btn bg-white text-primary-700 hover:bg-primary-50 btn-lg font-semibold shadow-lg">
                Create Free Account
              </a>
              <a href="#/documents" className="btn border-2 border-white/40 text-white hover:bg-white/10 btn-lg">
                <BookOpen className="w-5 h-5" />
                Browse Documents
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-44 bg-neutral-200 dark:bg-neutral-700" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>
    </div>
  );
}
