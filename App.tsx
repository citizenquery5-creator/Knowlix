import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { useRoute, useQueryParams } from './lib/router';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const DocumentDetailPage = lazy(() => import('./pages/DocumentDetailPage'));
const EbooksPage = lazy(() => import('./pages/EbooksPage'));
const EbookDetailPage = lazy(() => import('./pages/EbookDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AboutPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.ContactPage })));
const PrivacyPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.TermsPage })));
const DMCAPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.DMCAPage })));
const RefundPage = lazy(() => import('./pages/LegalPages').then(m => ({ default: m.RefundPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  );
}

function Router() {
  const route = useRoute();
  const params = useQueryParams();

  const docMatch = route.match(/^\/documents\/([^/]+)$/);
  const ebookMatch = route.match(/^\/ebooks\/([^/]+)$/);

  const hideChrome = route === '/auth' || route.startsWith('/auth');

  const knownRoutes = [
    '/', '/auth', '/documents', '/ebooks', '/search',
    '/dashboard', '/creator', '/admin', '/pricing',
    '/about', '/contact', '/privacy', '/terms', '/dmca', '/refund',
  ];
  const is404 = !knownRoutes.includes(route) && !docMatch && !ebookMatch;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {!hideChrome && <Header />}

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {route === '/' && <HomePage />}
          {hideChrome && (
            <AuthPage
              initialMode={(params.get('mode') as 'login' | 'signup' | 'forgot') ?? 'login'}
              onSuccess={() => { window.location.hash = '/'; }}
            />
          )}
          {route === '/documents' && (
            <DocumentsPage
              initialCategory={params.get('category') ?? ''}
              initialSort={params.get('sort') ?? 'latest'}
            />
          )}
          {docMatch && <DocumentDetailPage docId={docMatch[1]} />}
          {route === '/ebooks' && <EbooksPage />}
          {ebookMatch && <EbookDetailPage ebookId={ebookMatch[1]} />}
          {route === '/search' && <SearchPage />}
          {route === '/dashboard' && <UserDashboard />}
          {route === '/creator' && <CreatorDashboard />}
          {route === '/admin' && <AdminPanel />}
          {route === '/pricing' && <PricingPage />}
          {route === '/about' && <AboutPage />}
          {route === '/contact' && <ContactPage />}
          {route === '/privacy' && <PrivacyPage />}
          {route === '/terms' && <TermsPage />}
          {route === '/dmca' && <DMCAPage />}
          {route === '/refund' && <RefundPage />}
          {is404 && (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-4">
              <div className="text-7xl mb-5">🔍</div>
              <h1 className="text-3xl font-bold font-heading text-neutral-900 dark:text-white mb-3">Page Not Found</h1>
              <p className="text-neutral-500 mb-6 max-w-sm">The page you're looking for doesn't exist or has been moved.</p>
              <a href="#/" className="btn-primary btn-lg">Go Back Home</a>
            </div>
          )}
        </Suspense>
      </main>

      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
