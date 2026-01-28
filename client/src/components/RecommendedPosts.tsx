import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface RecommendedPostsProps {
  category?: string;
  limit?: number;
}

export function RecommendedPosts({ category, limit = 3 }: RecommendedPostsProps) {
  const { data: posts, isLoading } = trpc.blog.getPosts.useQuery({
    limit,
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">目前沒有推薦文章</p>
        <Button asChild className="mt-4">
          <Link href="/blog">查看所有文章</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {posts.map((item) => (
        <Card key={item.post.id} className="group hover:shadow-lg transition-shadow">
          {item.post.coverImage && (
            <div className="aspect-video overflow-hidden">
              <img
                src={item.post.coverImage}
                alt={item.post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {item.category && (
                <Badge variant="secondary">{item.category.name}</Badge>
              )}
            </div>
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
              {item.post.title}
            </CardTitle>
            {item.post.excerpt && (
              <CardDescription className="line-clamp-2">
                {item.post.excerpt}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(item.post.publishedAt || item.post.createdAt), "yyyy年MM月dd日", { locale: zhTW })}
              </span>
            </div>
            <Button asChild variant="outline" className="w-full group">
              <Link href={`/blog/${item.post.slug}`}>
                閱讀全文
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
