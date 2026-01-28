import { Router } from 'express';
import { getDb } from '../db';
import { posts, events } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Sitemap.xml 生成
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://ai-tw.manus.space';
    
    const db = await getDb();
    if (!db) {
      res.status(500).send('Database not available');
      return;
    }

    // 取得所有已發布的文章
    const publishedPosts = await db
      .select({
        slug: posts.slug,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(eq(posts.status, 'published'));

    // 取得所有已發布的活動
    const publishedEvents = await db
      .select({
        slug: events.slug,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .where(eq(events.status, 'published'));

    // 靜態頁面
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'weekly' }, // 首頁
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/events', priority: '0.9', changefreq: 'daily' },
      { url: '/courses', priority: '0.8', changefreq: 'weekly' },
      { url: '/learning', priority: '0.8', changefreq: 'weekly' },
    ];

    // 生成 XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 靜態頁面
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // 部落格文章
    publishedPosts.forEach((post: { slug: string; updatedAt: Date }) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // 活動頁面
    publishedEvents.forEach((event: { slug: string; updatedAt: Date }) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/events/${event.slug}</loc>\n`;
      xml += `    <lastmod>${event.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Robots.txt 生成
router.get('/robots.txt', (req, res) => {
  const baseUrl = 'https://ai-tw.manus.space';
  
  const robotsTxt = `# AI峰哥官方網站 Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_core/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# 爬蟲速率限制
Crawl-delay: 1
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

export default router;
