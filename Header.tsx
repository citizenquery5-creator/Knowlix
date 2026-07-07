import { useState, useRef, useEffect } from 'react';
import {
  BookOpen, Search, Sun, Moon, Globe, Bell, Menu, X, ChevronDown,
  User, Upload, LayoutDashboard, LogOut, Settings, Shield, Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { navigate, useRoute } from '../../lib/router';
import { supabase } from '../../lib/supabase';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { t, toggleLanguage } = useLang();
  const { isDark, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const currentRoute = useRoute();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count }) => setNotifCount(count ?? 0));
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/documents', label: t('documents') },
    { href: '/ebooks', label: t('ebooks') },
    { href: '/pricing', label: t('pricing') },
  ];

  const isActive = (href: string) => currentRoute === href || (href !== '/' && currentRoute.startsWith(href));

  const avatarUrl = profile?.avatar_url;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl shadow-soft border-b border-neutral-100 dark:border-neutral-800'
        : 'bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800'
    }`}>
      <div className="page-container">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <a
            href="#/"
            className="flex items-center gap-2.5 shrink-0 group"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-primary group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold font-heading text-neutral-900 dark:text-white leading-none">Knowlix</div>
              <div className="text-[10px] text-neutral-400 leading-none mt-0.5">Knowledge Without Limits</div>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={`#${link.href}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-primary-300 dark:focus:border-primary-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-neutral-900 dark:text-white placeholder-neutral-400 transition-all"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto lg:ml-0">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              title="Switch language"
              className="btn-ghost p-2 rounded-xl hidden sm:flex"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? t('lightMode') : t('darkMode')}
              className="btn-ghost p-2 rounded-xl hidden sm:flex"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <a href="#/dashboard?tab=notifications" className="btn-ghost p-2 rounded-xl relative hidden sm:flex">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </a>

                {/* User menu */}
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center border-2 border-primary-200 dark:border-primary-800">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={profile?.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{initials}</span>
                      )}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-neutral-900 rounded-2xl shadow-elevated border border-neutral-100 dark:border-neutral-800 py-2 animate-scale-in z-50">
                      <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                        <div className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{profile?.full_name}</div>
                        <div className="text-xs text-neutral-500 truncate">{profile?.email}</div>
                        {profile?.role !== 'free_user' && (
                          <span className="badge-primary text-[10px] mt-1 capitalize">{profile?.role?.replace('_', ' ')}</span>
                        )}
                      </div>

                      <UserMenuItem icon={<LayoutDashboard className="w-4 h-4" />} label={t('dashboard')} href="/dashboard" onClick={() => setUserMenuOpen(false)} />
                      {(profile?.role === 'creator' || profile?.role === 'admin' || profile?.role === 'premium_user') && (
                        <UserMenuItem icon={<Upload className="w-4 h-4" />} label={t('creatorDashboard')} href="/creator" onClick={() => setUserMenuOpen(false)} />
                      )}
                      {profile?.role === 'admin' && (
                        <UserMenuItem icon={<Shield className="w-4 h-4" />} label={t('adminPanel')} href="/admin" onClick={() => setUserMenuOpen(false)} />
                      )}
                      <UserMenuItem icon={<User className="w-4 h-4" />} label={t('profile')} href="/dashboard?tab=profile" onClick={() => setUserMenuOpen(false)} />
                      <UserMenuItem icon={<Zap className="w-4 h-4" />} label={t('pricing')} href="/pricing" onClick={() => setUserMenuOpen(false)} />

                      <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false); navigate('/'); }}
                          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <a href="#/auth" className="btn-secondary btn-sm hidden sm:flex">{t('login')}</a>
                <a href="#/auth?mode=signup" className="btn-primary btn-sm">{t('signup')}</a>
              </div>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-ghost p-2 rounded-xl lg:hidden"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 animate-slide-down">
          <div className="page-container py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="input pl-9"
                />
              </div>
            </form>
            {navLinks.map(link => (
              <a
                key={link.href}
                href={`#${link.href}`}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={toggleLanguage} className="btn-ghost btn-sm flex-1">{t('switchLanguage')}</button>
              <button onClick={toggleTheme} className="btn-ghost btn-sm flex-1">
                {isDark ? t('lightMode') : t('darkMode')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function UserMenuItem({ icon, label, href, onClick }: { icon: React.ReactNode; label: string; href: string; onClick: () => void }) {
  return (
    <a
      href={`#${href}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <span className="text-neutral-400">{icon}</span>
      {label}
    </a>
  );
}
