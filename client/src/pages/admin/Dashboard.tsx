import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FolderOpen, Tag, Plus } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: posts, isLoading: postsLoading } = trpc.blog.getAllPosts.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: categories, isLoading: categoriesLoading } = trpc.blog.getCategories.useQuery();
  const { data: tags, isLoading: tagsLoading } = trpc.blog.getTags.useQuery();

  if (authLoading || postsLoading || categoriesLoading || tagsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">權限不足</h2>
        <p className="text-muted-foreground">您沒有權限訪問此頁面</p>
      </div>
    );
  }

  const publishedPosts = posts?.filter((p) => p.post.status === "published").length || 0;
  const draftPosts = posts?.filter((p) => p.post.status === "draft").length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">後台管理</h1>
        <p className="text-muted-foreground mt-2">歡迎回來，{user.name || user.email}</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文章總數</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posts?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              已發布 {publishedPosts} 篇 · 草稿 {draftPosts} 篇
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分類數量</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories?.length || 0}</div>
            <p className="text-xs text-muted-foreground">文章分類</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">標籤數量</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags?.length || 0}</div>
            <p className="text-xs text-muted-foreground">文章標籤</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button asChild className="h-24 flex-col gap-2">
            <Link href="/admin/posts/new" className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>新增文章</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 flex-col gap-2">
            <Link href="/admin/posts" className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>管理文章</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 flex-col gap-2">
            <Link href="/admin/categories" className="flex flex-col items-center gap-2">
              <FolderOpen className="h-6 w-6" />
              <span>管理分類</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-24 flex-col gap-2">
            <Link href="/admin/tags">
              <a className="flex flex-col items-center gap-2">
                <Tag className="h-6 w-6" />
                <span>管理標籤</span>
              </a>
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      {posts && posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近文章</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {posts.slice(0, 5).map((item) => {
                const post = item.post;
                return (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {post.status === "published" ? "已發布" : "草稿"}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/posts/${post.id}`}>
                        <a>編輯</a>
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
