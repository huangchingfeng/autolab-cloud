import React, { createContext, useContext, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export type SupportedLanguage = 'zh-TW' | 'zh-CN' | 'en' | 'ko' | 'ja';

interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

interface TranslationContextType {
  currentLanguage: SupportedLanguage;
  isTranslating: boolean;
  setLanguage: (language: SupportedLanguage) => void;
  translatePage: (targetLanguage?: SupportedLanguage) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// 儲存翻譯結果的快取
const translationCache = new Map<string, Map<SupportedLanguage, string>>();

// 儲存原始文字內容
let originalTexts: Map<Element, string> | null = null;

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('zh-TW');
  const [isTranslating, setIsTranslating] = useState(false);

  const translateTextMutation = trpc.translation.translateBatch.useMutation();

  const setLanguage = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language);
  }, []);

  const translatePage = useCallback(async (targetLanguage?: SupportedLanguage) => {
    const lang = targetLanguage || currentLanguage;
    console.log('[Translation] translatePage called with:', { targetLanguage, lang, currentLanguage });
    
    if (lang === 'zh-TW') {
      // 恢復原始文字
      if (originalTexts) {
        originalTexts.forEach((originalText, element) => {
          if (element.textContent !== originalText) {
            element.textContent = originalText;
          }
        });
      }
      return;
    }

    setIsTranslating(true);

    try {
      // 選擇需要翻譯的元素
      const selectors = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'span:not(.lucide)', 'a', 'button',
        'li', 'td', 'th',
        'label', 'option',
        '[data-translate]'
      ];

      const elements = document.querySelectorAll(selectors.join(', '));
      const textsToTranslate: string[] = [];
      const elementsToUpdate: Element[] = [];

      // 儲存原始文字（只在第一次翻譯時）
      if (!originalTexts) {
        originalTexts = new Map();
      }

      elements.forEach((element) => {
        // 跳過空元素、腳本、樣式等
        if (!element.textContent || element.textContent.trim().length === 0) {
          return;
        }

        // 跳過只包含子元素的元素（避免重複翻譯）
        const childTextLength = Array.from(element.children).reduce(
          (sum, child) => sum + (child.textContent?.length || 0),
          0
        );
        if (element.children.length > 0 && childTextLength === element.textContent.trim().length) {
          return;
        }

        // 跳過不需要翻譯的元素
        if (
          element.closest('[data-no-translate]') ||
          element.tagName === 'SCRIPT' ||
          element.tagName === 'STYLE' ||
          element.tagName === 'CODE' ||
          element.classList.contains('lucide')
        ) {
          return;
        }

        const text = element.textContent.trim();

        // 儲存原始文字
        if (!originalTexts!.has(element)) {
          originalTexts!.set(element, text);
        }

        // 檢查快取
        const originalText = originalTexts!.get(element) || text;
        const cacheKey = originalText;
        
        if (!translationCache.has(cacheKey)) {
          translationCache.set(cacheKey, new Map());
        }

        const languageCache = translationCache.get(cacheKey)!;
        
        if (languageCache.has(lang)) {
          // 使用快取的翻譯
          element.textContent = languageCache.get(lang)!;
        } else {
          // 需要翻譯
          textsToTranslate.push(originalText);
          elementsToUpdate.push(element);
        }
      });

      if (textsToTranslate.length === 0) {
        console.log('[Translation] No texts to translate (all cached)');
        setIsTranslating(false);
        return;
      }
      
      console.log('[Translation] Translating', textsToTranslate.length, 'texts to', lang);

      // 批次翻譯
      const result = await translateTextMutation.mutateAsync({
        texts: textsToTranslate,
        targetLanguage: lang,
      });

      // 更新頁面文字並儲存到快取
      result.translatedTexts.forEach((translatedText, index) => {
        const element = elementsToUpdate[index];
        const originalText = textsToTranslate[index];

        element.textContent = translatedText;

        // 儲存到快取
        const cacheKey = originalText;
        const languageCache = translationCache.get(cacheKey)!;
        languageCache.set(lang, translatedText);
      });

      console.log('[Translation] Translation completed successfully');
      toast.success(`已翻譯為${SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name}`);
    } catch (error) {
      console.error('[Translation] Translation error:', error);
      toast.error('翻譯失敗，請稍後再試');
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, translateTextMutation]);

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        isTranslating,
        setLanguage,
        translatePage,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}
