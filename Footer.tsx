import { BookOpen, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const categories = [
    'Nursing Notes', 'B.Sc Nursing', 'GNM', 'ANM',
    'Research Papers', 'Assignments', 'Previous Year Papers', 'E-Books',
  ];

  const quickLinks = [
    { label: t('home'), href: '/' },
    { label: t('documents'), href: '/documents' },
    { label: t('ebooks'), href: '/ebooks' },
    { label: t('pricing'), href: '/pricing' },
    { label: t('aboutUs'), href: '/about' },
    { label: t('contactUs'), href: '/contact' },
  ];

  const legalLinks = [
    { label: t('privacyPolicy'), href: '/privacy' },
    { label: t('termsConditions'), href: '/terms' },
    { label: t('dmcaPolicy'), href: '/dmca' },
    { label: t('refundPolicy'), href: '/refund' },
  ];

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-white mt-20">
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="#/" className="flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold font-heading">Knowlix</div>
                <div className="text-xs text-neutral-400">Knowledge Without Limits</div>
              </div>
            </a>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">
              India's premier educational document platform. Access thousands of study materials, notes, and e-books for students and professionals.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Youtube, href: '#' },
              ].map(({ icon: Icon, href }) => (
                <a key={href} href={href} className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold font-heading mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <a href={`#${link.href}`} className="text-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-primary-400 transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold font-heading mb-4 text-white">Categories</h3>
            <ul className="space-y-2.5">
              {categories.map(cat => (
                <li key={cat}>
                  <a href={`#/documents?category=${encodeURIComponent(cat)}`} className="text-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-neutral-600 group-hover:bg-primary-400 transition-colors" />
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h3 className="font-semibold font-heading mb-4 text-white">Contact Us</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-sm text-neutral-400">
                <Mail className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>support@knowlix.in</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-400">
                <Phone className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>+91 9406970754</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-400">
                <MapPin className="w-4 h-4 mt-0.5 text-primary-400 shrink-0" />
                <span>India</span>
              </li>
            </ul>

            <h3 className="font-semibold font-heading mb-3 text-white">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <a href={`#${link.href}`} className="text-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-1.5 group">
                    <ExternalLink className="w-3 h-3 group-hover:text-primary-400" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500 text-center sm:text-left">
            © {year} Knowlix. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-600">Powered by Supabase</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              <span className="text-xs text-neutral-500">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
