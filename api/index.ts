/**
 * Vercel Serverless Function Entry Point
 * Routes all /api/* requests to the Express app
 */

// Note: Environment variables are automatically available in Vercel
// No need for dotenv in production

import { createApp } from "../server/_core/app";

const app = createApp();

export default app;
