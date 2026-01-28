import { useEffect } from 'react';

interface PersonSchema {
  type: 'Person';
  name: string;
  alternateName?: string;
  jobTitle: string;
  description: string;
  url: string;
  image: string;
  email: string;
  telephone: string;
  sameAs?: string[];
}

interface OrganizationSchema {
  type: 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
  email: string;
  telephone: string;
  address?: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressRegion: string;
  };
  sameAs?: string[];
}

interface BlogPostingSchema {
  type: 'BlogPosting';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': 'WebPage';
    '@id': string;
  };
}

interface FAQPageSchema {
  type: 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

interface CollectionPageSchema {
  type: 'CollectionPage';
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
}

interface EventSchema {
  type: 'Event';
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: {
    '@type': 'Place' | 'VirtualLocation';
    name: string;
    address?: string;
    url?: string;
  };
  image?: string;
  organizer: {
    '@type': 'Person' | 'Organization';
    name: string;
    url: string;
  };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
  eventStatus?: string;
  eventAttendanceMode?: string;
}

type SchemaType = PersonSchema | OrganizationSchema | BlogPostingSchema | EventSchema | FAQPageSchema | CollectionPageSchema;

interface JsonLdSchemaProps {
  data: SchemaType;
}

export function JsonLdSchema({ data }: JsonLdSchemaProps) {
  useEffect(() => {
    // 建立 JSON-LD script 標籤
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    let schemaData: any = {
      '@context': 'https://schema.org',
    };

    switch (data.type) {
      case 'Person':
        schemaData = {
          ...schemaData,
          '@type': 'Person',
          name: data.name,
          alternateName: data.alternateName,
          jobTitle: data.jobTitle,
          description: data.description,
          url: data.url,
          image: data.image,
          email: data.email,
          telephone: data.telephone,
          sameAs: data.sameAs,
        };
        break;

      case 'Organization':
        schemaData = {
          ...schemaData,
          '@type': 'Organization',
          name: data.name,
          url: data.url,
          logo: data.logo,
          description: data.description,
          email: data.email,
          telephone: data.telephone,
          address: data.address,
          sameAs: data.sameAs,
        };
        break;

      case 'BlogPosting':
        schemaData = {
          ...schemaData,
          '@type': 'BlogPosting',
          headline: data.headline,
          description: data.description,
          image: data.image,
          datePublished: data.datePublished,
          dateModified: data.dateModified,
          author: data.author,
          publisher: data.publisher,
          mainEntityOfPage: data.mainEntityOfPage,
        };
        break;

      case 'FAQPage':
        schemaData = {
          ...schemaData,
          '@type': 'FAQPage',
          mainEntity: data.mainEntity,
        };
        break;

      case 'Event':
        schemaData = {
          ...schemaData,
          '@type': 'Event',
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          location: data.location,
          image: data.image,
          organizer: data.organizer,
          offers: data.offers,
          eventStatus: data.eventStatus || 'https://schema.org/EventScheduled',
          eventAttendanceMode: data.eventAttendanceMode || 'https://schema.org/OfflineEventAttendanceMode',
        };
        break;

      case 'CollectionPage':
        schemaData = {
          ...schemaData,
          '@type': 'CollectionPage',
          name: data.name,
          description: data.description,
          url: data.url,
          ...(data.numberOfItems && { numberOfItems: data.numberOfItems }),
        };
        break;
    }

    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    // Cleanup
    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}

// 預設 Schema 資料
export const defaultPersonSchema: PersonSchema = {
  type: 'Person',
  name: '黃敬峰',
  alternateName: 'AI峰哥',
  jobTitle: 'AI 企業培訓講師',
  description: '台灣企業AI職場實戰專家，擁有 10 年企業培訓經驗，專精 ChatGPT、Gemini、AI 工具實戰應用。服務超過 400 家企業。',
  url: 'https://ai-tw.manus.space',
  image: 'https://ai-tw.manus.space/teacher-photo.jpg',
  email: 'nikeshoxmiles@gmail.com',
  telephone: '+886-976-715-102',
  sameAs: [
    'https://line.me/ti/p/0976715102',
  ],
};

export const defaultOrganizationSchema: OrganizationSchema = {
  type: 'Organization',
  name: 'AI峰哥 - 黃敬峰企業AI培訓',
  url: 'https://ai-tw.manus.space',
  logo: 'https://ai-tw.manus.space/teacher-photo.jpg',
  description: '專注於企業AI職場實戰培訓，協助團隊建立可複用的AI工作流，提升工作效率與競爭力。',
  email: 'nikeshoxmiles@gmail.com',
  telephone: '+886-976-715-102',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'TW',
    addressRegion: '台灣',
  },
};
