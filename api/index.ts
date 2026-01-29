/**
 * Vercel Serverless API - Placeholder
 * Full API is deployed on Render
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENDER_API_URL = process.env.RENDER_API_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/';

  // If Render API is configured, proxy requests
  if (RENDER_API_URL) {
    try {
      const targetUrl = `${RENDER_API_URL}${path}`;
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization as string })
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
      });

      const data = await response.text();
      res.status(response.status);
      res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
      return res.send(data);
    } catch (error) {
      console.error('Proxy error:', error);
    }
  }

  // Health check
  if (path.includes('/health')) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      hasDb: !!process.env.DATABASE_URL,
      renderApi: !!RENDER_API_URL
    });
  }

  // Default - API not fully configured
  return res.status(503).json({
    error: 'API backend not configured',
    message: 'Full API deployment in progress'
  });
}
