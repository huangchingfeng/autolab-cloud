import { useState, useRef, useEffect } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { 
  PlayCircle, 
  FileText, 
  StickyNote, 
  Download, 
  ArrowLeft,
  Save,
  Users,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState("video");
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const courseIdNum = parseInt(courseId || "0", 10);

  const { data: course, isLoading } = trpc.videoCourses.getCourseForViewing.useQuery(
    { courseId: courseIdNum },
    { enabled: !!courseIdNum && !!user }
  );

  const { data: existingNote } = trpc.videoCourses.getNote.useQuery(
    { courseId: courseIdNum },
    { enabled: !!courseIdNum && !!user }
  );

  const saveNoteMutation = trpc.videoCourses.saveNote.useMutation({
    onSuccess: () => {
      toast.success("筆記已儲存");
      setIsSavingNotes(false);
    },
    onError: () => {
      toast.error("儲存失敗，請稍後再試");
      setIsSavingNotes(false);
    },
  });

  // Load existing notes
  useEffect(() => {
    if (existingNote?.content) {
      setNotes(existingNote.content);
    }
  }, [existingNote]);

  // Auto-save notes with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value);
    
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    
    notesTimeoutRef.current = setTimeout(() => {
      if (value.trim() && courseIdNum) {
        setIsSavingNotes(true);
        saveNoteMutation.mutate({
          courseId: courseIdNum,
          content: value,
        });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  };

  const handleSaveNotes = () => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    if (notes.trim() && courseIdNum) {
      setIsSavingNotes(true);
      saveNoteMutation.mutate({
        courseId: courseIdNum,
        content: notes,
      });
    }
  };

  const handleDownloadNotes = () => {
    if (!notes.trim()) {
      toast.error("筆記內容為空");
      return;
    }
    
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course?.title || "課程"}_筆記.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("筆記已下載");
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-8 bg-slate-800" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full bg-slate-800" />
            </div>
            <div>
              <Skeleton className="h-64 w-full bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">無法存取課程</h1>
          <p className="text-slate-400 mb-6">您可能尚未購買此課程，或課程不存在。</p>
          <Link href="/courses">
            <Button>瀏覽課程</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/learning">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回學習中心
              </Button>
            </Link>
            <h1 className="text-lg font-semibold truncate max-w-md">{course.title}</h1>
          </div>
          {course.studentGroupUrl && (
            <a href={course.studentGroupUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                加入學員群組
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {course.videoUrl ? (
                <iframe
                  src={course.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-slate-600" />
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="lg:col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="w-full grid grid-cols-2 bg-slate-800">
                <TabsTrigger value="video" className="data-[state=active]:bg-slate-700">
                  <FileText className="h-4 w-4 mr-2" />
                  簡報
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:bg-slate-700">
                  <StickyNote className="h-4 w-4 mr-2" />
                  筆記
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="mt-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">課程簡報</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.slidesUrl ? (
                      <div className="aspect-[4/3] bg-white rounded overflow-hidden">
                        <iframe
                          src={course.slidesUrl}
                          className="w-full h-full"
                          allow="fullscreen"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-slate-700 rounded flex items-center justify-center">
                        <p className="text-slate-400">此課程暫無簡報</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-lg">我的筆記</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadNotes}
                        disabled={!notes.trim()}
                        className="text-slate-400 hover:text-white"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes || !notes.trim()}
                        className="text-slate-400 hover:text-white"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="在這裡記錄您的學習筆記...&#10;&#10;筆記會自動儲存，您也可以下載為文字檔。"
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      className="min-h-[300px] bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {isSavingNotes ? "儲存中..." : "筆記會自動儲存"}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Course Description */}
        <div className="mt-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">課程說明</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 whitespace-pre-wrap">{course.description}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
