import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "wouter";

interface RelatedPostsProps {
  postId: number;
  currentSlug: string;
}

export function RelatedPosts({ postId, currentSlug }: RelatedPostsProps) {
  const { data: relatedPosts, isLoading } = trpc.blog.getRelatedPosts.useQuery(
    { postId, limit: 3 },
    { enabled: !!postId }
  );

  if (isLoading) {
    return (
      <section className="container py-16 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">相關文章推薦</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!relatedPosts || relatedPosts.length === 0) {
    return null;
  }

  // Filter out the current post if it somehow appears
  const filteredPosts = relatedPosts.filter(
    (item) => item.post.slug !== currentSlug
  );

  if (filteredPosts.length === 0) {
    return null;
  }

  return (
    <section className="container py-16 border-t bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center">相關文章推薦</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {filteredPosts.slice(0, 3).map((item) => (
            <Link
              key={item.post.id}
              href={`/blog/${item.post.slug}`}
              className="block group"
            >
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                {/* Cover Image */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                  {item.post.coverImage ? (
                    <img
                      src={item.post.coverImage}
                      alt={item.post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      📝
                    </div>
                  )}
                  {item.category && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 text-xs"
                    >
                      {item.category.name}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {item.post.title}
                  </h3>

                  {item.post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.post.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {item.post.publishedAt
                        ? format(new Date(item.post.publishedAt), "yyyy/MM/dd", {
                            locale: zhTW,
                          })
                        : "未發布"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
