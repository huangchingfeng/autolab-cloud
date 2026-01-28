import { Globe, Loader2 } from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/contexts/TranslationContext';

export function LanguageSwitcher() {
  const { currentLanguage, isTranslating, setLanguage, translatePage } = useTranslation();

  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const language = event.target.value as SupportedLanguage;
    console.log('[LanguageSwitcher] Language changed to:', language);
    setLanguage(language);
    await translatePage(language);
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);

  return (
    <div className="relative inline-flex items-center gap-2" data-no-translate>
      {isTranslating ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Globe className="h-4 w-4 text-muted-foreground" />
      )}
      <select
        value={currentLanguage}
        onChange={handleLanguageChange}
        disabled={isTranslating}
        className="appearance-none bg-transparent border border-border/50 rounded-md px-3 py-1.5 pr-8 text-sm font-medium hover:border-border hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
