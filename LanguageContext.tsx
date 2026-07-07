import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, Lang, TranslationKey } from '../lib/translations';

interface LanguageContextValue {
  lang: Lang;
  t: (key: TranslationKey) => string;
  toggleLanguage: () => void;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('knowlix_lang');
    return (stored === 'hi' || stored === 'en') ? stored : 'en';
  });

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('knowlix_lang', l);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang(lang === 'en' ? 'hi' : 'en');
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLanguage, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
