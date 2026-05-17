import { Router, type Request } from 'express';
import { getDb } from '../db';
import { posts, events } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

function getBaseUrl(req: Request) {
  const configuredBaseUrl = process.env.VITE_APP_URL?.trim();
  const fallbackBaseUrl = `${req.protocol}://${req.get('host')}`;
  return (configuredBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

// Sitemap.xml 生成
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = getBaseUrl(req);
    let publishedPosts: Array<{ slug: string; updatedAt: Date | string }> = [];
    let publishedEvents: Array<{ slug: string; updatedAt: Date | string }> = [];
    const skipDynamicEntries = process.env.SITEMAP_SKIP_DYNAMIC === 'true';

    if (!skipDynamicEntries) {
      try {
        const db = await getDb();
        if (db) {
          // 取得所有已發布的文章
          publishedPosts = await db
            .select({
              slug: posts.slug,
              updatedAt: posts.updatedAt,
            })
            .from(posts)
            .where(eq(posts.status, 'published'));

          // 取得所有已發布的活動
          publishedEvents = await db
            .select({
              slug: events.slug,
              updatedAt: events.updatedAt,
            })
            .from(events)
            .where(eq(events.status, 'published'));
        }
      } catch (error) {
        console.warn('Sitemap dynamic entries unavailable:', error);
      }
    }

    // 靜態頁面
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'weekly' }, // 首頁
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/corporate-training', priority: '0.9', changefreq: 'weekly' },
      { url: '/2026-ai-course', priority: '0.9', changefreq: 'weekly' },
      { url: '/ai-super-sales', priority: '0.9', changefreq: 'weekly' },
      { url: '/insurance-ai-tools', priority: '0.8', changefreq: 'weekly' },
      { url: '/ai-business-flywheel', priority: '0.8', changefreq: 'weekly' },
      { url: '/coaching', priority: '0.8', changefreq: 'monthly' },
      { url: '/topics', priority: '0.8', changefreq: 'monthly' },
      { url: '/prompt-library', priority: '0.7', changefreq: 'weekly' },
      { url: '/clients', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.9', changefreq: 'daily' },
      { url: '/events', priority: '0.9', changefreq: 'daily' },
      { url: '/courses', priority: '0.8', changefreq: 'weekly' },
      { url: '/learning', priority: '0.8', changefreq: 'weekly' },
      { url: '/testimonials', priority: '0.7', changefreq: 'monthly' },
      { url: '/faq', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact', priority: '0.8', changefreq: 'monthly' },
    ];

    // 生成 XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 靜態頁面
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}${page.url}`)}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // 部落格文章
    publishedPosts.forEach((post) => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(post.updatedAt)}</lastmod>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    });

    // 活動頁面
    publishedEvents.forEach((event) => {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(`${baseUrl}/events/${event.slug}`)}</loc>\n`;
      xml += `    <lastmod>${formatDate(event.updatedAt)}</lastmod>\n`;
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
  const baseUrl = getBaseUrl(req);
  
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
