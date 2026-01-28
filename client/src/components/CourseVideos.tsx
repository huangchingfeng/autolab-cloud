import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const videos = [
  {
    id: 1,
    title: "AI 工具實戰應用",
    description: "學員現場操作 AI 工具解決實際工作問題",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018137402-q34lji.mov",
  },
  {
    id: 2,
    title: "企業內訓精華",
    description: "企業團隊 AI 導入培訓現場實況",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018142710-3t4i2.mov",
  },
  {
    id: 3,
    title: "Prompt 工程實作",
    description: "從零開始學習提示詞設計技巧",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018149511-3zljzr.mov",
  },
  {
    id: 4,
    title: "AI 自動化工作流",
    description: "建立可複用的 AI 工作流程",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018156978-gd7vim.mov",
  },
  {
    id: 5,
    title: "學員成果展示",
    description: "學員課後實際應用成果分享",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018160939-s6uf1o.mov",
  },
  {
    id: 6,
    title: "Q&A 互動時間",
    description: "課程中的問答互動精華片段",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/course-videos/video-1766018167185-0szbk.mov",
  },
];

export default function CourseVideos() {
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-primary/10 text-primary rounded-full">
            🎬 課程精華
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            過往課程精華影片
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            實際課程現場實況，讓您了解阿峰老師的教學風格與課程內容
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group relative bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Video Thumbnail Area */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <Button
                  variant="secondary"
                  size="lg"
                  className="relative z-10 rounded-full w-16 h-16 p-0 shadow-lg group-hover:scale-110 transition-transform"
                  onClick={() => setSelectedVideo(video)}
                >
                  <Play className="h-8 w-8 ml-1" />
                </Button>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
                  精華片段
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-muted-foreground mb-4">
            想了解更多課程內容？歡迎預約諮詢
          </p>
          <Button asChild size="lg">
            <a href="/#contact">立即諮詢</a>
          </Button>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedVideo?.title || "課程影片"}
          </DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={() => setSelectedVideo(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            {selectedVideo && (
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                className="w-full aspect-video"
              >
                您的瀏覽器不支援影片播放
              </video>
            )}
          </div>
          {selectedVideo && (
            <div className="p-4 bg-card">
              <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
