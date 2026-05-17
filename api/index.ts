import type { VercelRequest, VercelResponse } from '@vercel/node';

const RENDER_API_URL = process.env.RENDER_API_URL;
let appPromise: Promise<NonNullable<Awaited<ReturnType<typeof loadApp>>>> | null = null;

async function loadApp() {
  const module = await import('../server/_core/app');
  return module.default;
}

function getApp() {
  appPromise ??= loadApp();
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/';

  // If a dedicated Render API is configured, keep using it as the primary backend.
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

  const app = await getApp();
  return app(req, res);
}
