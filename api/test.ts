import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasClerkKey: !!process.env.CLERK_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
}
