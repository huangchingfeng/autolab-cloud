import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, Eye } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { SeoHead } from "@/components/SeoHead";
import SubstackBanner from "@/components/SubstackBanner";

export default function Blog() {
  const seoTitle = "部落格 - AI 實戰教學、ChatGPT 與 Gemini 應用技巧 | 黃敬峰 AI峰哥";
  const seoDescription = "探索 AI 應用的最新趨勢與實戰技巧，包含 ChatGPT、Gemini、NotebookLM 等工具教學，以及企業 AI 導入案例分享。由台灣企業 AI 職場實戰專家黃敬峰（AI峰哥）撰寫。";
  const seoKeywords = "AI教學, ChatGPT, Gemini, 企業AI, 職場AI, AI峰哥";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: posts, isLoading: postsLoading } = trpc.blog.getPosts.useQuery({
    limit: 20,
  });

  const { data: categories } = trpc.blog.getCategories.useQuery();

  const { data: searchResults, isLoading: searchLoading } = trpc.blog.searchPosts.useQuery(
    { searchTerm },
    { enabled: searchTerm.length > 2 }
  );

  const { data: categoryPosts, isLoading: categoryLoading } = trpc.blog.getPostsByCategory.useQuery(
    { categorySlug: selectedCategory! },
    { enabled: !!selectedCategory }
  );

  const displayPosts = searchTerm.length > 2
    ? searchResults
    : selectedCategory
    ? categoryPosts
    : posts;

  const isLoading = searchTerm.length > 2 ? searchLoading : selectedCategory ? categoryLoading : postsLoading;

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl="https://ai-tw.manus.space/blog"
      />
      <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Substack 訂閱橫幅 */}
        <SubstackBanner />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                阿峰老師的部落格
              </h1>
              <p className="text-lg text-muted-foreground">
                探索 AI 職場應用的最新知識與實戰技巧
              </p>

              {/* H2 Section */}
              <div className="mt-8 space-y-4">
                <h2 className="text-2xl font-semibold">
                  最新 AI 工具教學與企業導入案例
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜尋文章..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container py-4">
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  全部
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="py-16 md:py-24">
          <div className="container">
            {isLoading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-48 bg-muted rounded-lg"></div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-6 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayPosts && displayPosts.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {displayPosts.map((item) => {
                  const post = item.post;
                  const author = item.author;
                  const category = item.category;

                  return (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="block">
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                        <CardHeader className="p-0 overflow-hidden">
                          {post.coverImage ? (
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                              <span className="text-6xl">📝</span>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            {category && (
                              <Badge variant="secondary">{category.name}</Badge>
                            )}
                            <h3 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            {author && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{author.name}</span>
                              </div>
                            )}
                            {post.publishedAt && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(new Date(post.publishedAt), "yyyy/MM/dd", {
                                    locale: zhTW,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{post.viewCount}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground">尚無文章</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
}
