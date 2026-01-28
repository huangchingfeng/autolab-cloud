import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryImage {
  url: string;
  title: string;
  description?: string;
}

interface CourseGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export function CourseGallery({ images, title = "課程內容預覽" }: CourseGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900">
          {title}
        </h2>
        
        {/* Grid Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              onClick={() => openLightbox(index)}
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{image.title}</h3>
                  {image.description && (
                    <p className="text-white/80 text-sm mt-1">{image.description}</p>
                  )}
                </div>
              </div>
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Dialog */}
        <Dialog open={selectedIndex !== null} onOpenChange={() => closeLightbox()}>
          <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black/95 border-none">
            <DialogTitle className="sr-only">圖片預覽</DialogTitle>
            
            {selectedIndex !== null && (
              <div className="relative">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
                  onClick={closeLightbox}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Navigation Buttons */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>

                {/* Image */}
                <div className="flex items-center justify-center min-h-[60vh] p-4">
                  <img
                    src={images[selectedIndex].url}
                    alt={images[selectedIndex].title}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                </div>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white font-semibold text-xl">
                    {images[selectedIndex].title}
                  </h3>
                  {images[selectedIndex].description && (
                    <p className="text-white/80 mt-2">
                      {images[selectedIndex].description}
                    </p>
                  )}
                  <div className="text-white/60 text-sm mt-2">
                    {selectedIndex + 1} / {images.length}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

// NotebookLM 課程專用圖片資料
export const notebookLMCourseImages: GalleryImage[] = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-2026-ai-upgrade-y0c251ob.png",
    title: "2026 年 AI 升級",
    description: "別讓你的 AI 隊友停留在舊版本"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-iceberg-potential-5noxgebz.png",
    title: "NotebookLM 的隱藏潛力",
    description: "你只發揮了 20% 的實力"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-old-pain-points-2u8po5i7.png",
    title: "舊方法的痛點",
    description: "資料孤島、AI 機械化、產出中斷"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-thinking-partner-92i2ns75.png",
    title: "思考夥伴的真正樣貌",
    description: "從被動整理到主動策略"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-solution-1-multimodal-u732lq1r.png",
    title: "新解法一：多模態整合",
    description: "讓 AI 聽懂你的世界"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-solution-2-podcast-hjtk8n8n.png",
    title: "新解法二：AI Podcast",
    description: "把報告變成精彩 Podcast"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-solution-3-creation-kuir2a6t.png",
    title: "新解法三：一鍵創作",
    description: "從對話到最終成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-2026-superpower-kqjnv7l5.png",
    title: "2026 職場超能力者",
    description: "業務銷售、個人品牌、專案管理"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/notebooklm-testimonial-gift-ji9lecqu.png",
    title: "學員好評與豪華大禮包",
    description: "完整操作簡報、50+ Prompt 範本、課程回放"
  }
];


// 學員成果展示圖片資料
export const studentWorksImages: GalleryImage[] = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-01-32mrn46q.png",
    title: "學員作品 1",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-02-hi6r1szh.png",
    title: "學員作品 2",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-03-09qmh6y7.png",
    title: "學員作品 3",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-04-fcbuqgsq.png",
    title: "學員作品 4",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-05-fgdrnhdo.png",
    title: "學員作品 5",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-06-4amdy5hr.png",
    title: "學員作品 6",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-07-nhaw66l2.png",
    title: "學員作品 7",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-08-4xveac5i.png",
    title: "學員作品 8",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-09-2w9wql90.png",
    title: "學員作品 9",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-10-fybimiar.png",
    title: "學員作品 10",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-11-s4kw7uyg.png",
    title: "學員作品 11",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-12-1yyoo98z.png",
    title: "學員作品 12",
    description: "NotebookLM 實戰成果"
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/notebooklm-course/student-works/student-work-13-9aiy0fno.png",
    title: "學員作品 13",
    description: "NotebookLM 實戰成果"
  }
];
