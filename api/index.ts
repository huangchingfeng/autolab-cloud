import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url || '/';

  // Health check
  if (path.includes('/health')) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      hasDb: !!process.env.DATABASE_URL,
      apiStatus: 'partial - tRPC pending'
    });
  }

  // tRPC requests - redirect info
  if (path.includes('/trpc')) {
    return res.status(503).json({
      error: 'tRPC API configuration in progress',
      message: 'The full API backend is being configured. Basic functionality available.'
    });
  }

  // Default response
  return res.status(200).json({
    message: 'API is working',
    path,
    method: req.method,
    note: 'Full tRPC API configuration in progress'
  });
}
