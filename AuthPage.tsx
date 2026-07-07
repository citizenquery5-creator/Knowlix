import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

type AuthMode = 'login' | 'signup' | 'forgot';

interface AuthPageProps {
  onSuccess?: () => void;
  initialMode?: AuthMode;
}

export default function AuthPage({ onSuccess, initialMode = 'login' }: AuthPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const { t } = useLang();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { toast(error, 'error'); return; }
        toast('Welcome back!', 'success');
        onSuccess?.();
      } else if (mode === 'signup') {
        if (password !== confirmPassword) { toast('Passwords do not match', 'error'); return; }
        if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
        const { error } = await signUp(email, password, fullName);
        if (error) { toast(error, 'error'); return; }
        toast('Account created successfully!', 'success');
        onSuccess?.();
      } else {
        const { error } = await resetPassword(email);
        if (error) { toast(error, 'error'); return; }
        toast(t('emailSent'), 'success');
        setMode('login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-accent-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="#/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold font-heading text-white">Knowlix</div>
              <div className="text-xs text-primary-300">Knowledge Without Limits</div>
            </div>
          </a>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-elevated p-8 border border-neutral-100 dark:border-neutral-800">
          {/* Back button for forgot */}
          {mode === 'forgot' && (
            <button
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t('back')}
            </button>
          )}

          <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-white mb-1">
            {mode === 'login' ? t('signInToAccount') : mode === 'signup' ? t('createAccount') : t('resetPassword')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            {mode === 'login' ? t('hasAccount').replace('Already', "Don't").split('?')[0] + '? ' : ''}
            {mode === 'login' ? (
              <button onClick={() => setMode('signup')} className="text-primary-600 hover:text-primary-700 font-medium">
                {t('signup')}
              </button>
            ) : mode === 'signup' ? (
              <span>{t('hasAccount')} <button onClick={() => setMode('login')} className="text-primary-600 hover:text-primary-700 font-medium">{t('login')}</button></span>
            ) : 'Enter your email to receive a reset link'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input pl-10"
                    placeholder="Ankit Sharma"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t('emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t('rememberMe')}
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg w-full mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading
                ? t('loading')
                : mode === 'login'
                  ? t('login')
                  : mode === 'signup'
                    ? t('signup')
                    : t('resetPassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
