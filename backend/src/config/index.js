import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dbFilePath: process.env.DB_FILE_PATH || path.resolve(__dirname, '../../data/planner.db'),
  llm: {
    provider: process.env.LLM_PROVIDER || 'mock', // 'gemini' | 'openrouter' | 'mock'
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-flash-1.5'
  },
  rateLimit: {
    generalWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    generalMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    llmMax: parseInt(process.env.LLM_RATE_LIMIT_MAX_REQUESTS || '30', 10)
  },
  bodyLimit: process.env.BODY_LIMIT || '1mb'
};

