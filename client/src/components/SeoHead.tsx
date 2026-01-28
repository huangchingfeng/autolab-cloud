import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
}

export function SeoHead({
  title,
  description,
  keywords,
  ogImage = '/teacher-photo.jpg',
  ogType = 'website',
  canonicalUrl,
}: SeoHeadProps) {
  useEffect(() => {
    // 設定頁面標題
    document.title = title;

    // 更新或建立 meta 標籤的輔助函數
    const updateMetaTag = (selector: string, content: string) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        const selectorParts = selector.match(/\[(.+?)="(.+?)"\]/);
        if (selectorParts) {
          tag.setAttribute(selectorParts[1], selectorParts[2]);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 基本 SEO 標籤
    updateMetaTag('meta[name="description"]', description);
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', keywords);
    }

    // Open Graph 標籤
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:type"]', ogType);
    updateMetaTag('meta[property="og:image"]', ogImage);
    if (canonicalUrl) {
      updateMetaTag('meta[property="og:url"]', canonicalUrl);
    }

    // Twitter Card 標籤
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', ogImage);

    // Canonical URL
    if (canonicalUrl) {
      let linkTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.rel = 'canonical';
        document.head.appendChild(linkTag);
      }
      linkTag.href = canonicalUrl;
    }
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);

  return null;
}
