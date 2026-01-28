import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { SeoHead } from "@/components/SeoHead";
import { JsonLdSchema } from "@/components/JsonLdSchema";
import { Calendar, User, ArrowRight } from "lucide-react";

export function BlogCategory() {
  const { slug } = useParams();
  const { data: category, isLoading: categoryLoading } = trpc.blog.getCategoryBySlug.useQuery({ slug: slug || "" });
  const { data: posts, isLoading: postsLoading } = trpc.blog.getPostsByCategory.useQuery({ categorySlug: slug || "" });

  if (categoryLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 space-y-4">
                  <div className="h-48 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">找不到分類</h1>
          <p className="text-gray-600 mb-8">您查找的分類不存在</p>
          <Link href="/blog">
            <a className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              返回部落格列表
              <ArrowRight size={20} />
            </a>
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `https://ai-tw.manus.space/blog/category/${slug}`;
  const postCount = posts?.length || 0;

  return (
    <>
      <SeoHead
        title={`${category.name} - AI峰哥部落格`}
        description={category.description || `瀏覽所有關於${category.name}的文章，包含 AI 工具教學、實戰案例和最佳實踐。`}
        keywords={`${category.name}, AI 教學, ChatGPT, Gemini, AI 工具, 企業培訓`}
        ogImage="https://ai-tw.manus.space/teacher-photo.jpg"
      />
      
      <JsonLdSchema
        data={{
          type: "CollectionPage",
          name: `${category.name} - AI峰哥部落格`,
          description: category.description || `所有關於${category.name}的文章`,
          url: pageUrl,
          numberOfItems: postCount,
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="container">
          {/* 分類標題區塊 */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {category.name}
            </h1>
            {category.description && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {category.description}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-4 text-gray-500">
              <span className="flex items-center gap-2">
                <Calendar size={18} />
                共 {postCount} 篇文章
              </span>
            </div>
          </div>

          {/* 文章列表 */}
          {posts && posts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link key={post.post.id} href={`/blog/${post.post.slug}`}>
                  <a className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* 封面圖片 */}
                    {post.post.coverImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.post.coverImage}
                          alt={post.post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* 文章內容 */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {post.post.title}
                      </h3>

                      {post.post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {post.post.excerpt}
                        </p>
                      )}

                      {/* 文章元資訊 */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>{post.author?.name || "AI峰哥"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>
                            {post.post.publishedAt
                              ? new Date(post.post.publishedAt).toLocaleDateString("zh-TW")
                              : "未發布"}
                          </span>
                        </div>
                      </div>


                    </div>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">此分類目前沒有文章</p>
              <Link href="/blog">
                <a className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  瀏覽所有文章
                  <ArrowRight size={20} />
                </a>
              </Link>
            </div>
          )}

          {/* 返回連結 */}
          <div className="mt-12 text-center">
            <Link href="/blog">
              <a className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium">
                <ArrowRight size={20} className="rotate-180" />
                返回部落格列表
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
