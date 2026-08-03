import dotenv from 'dotenv';

dotenv.config();

// Fails fast and loudly at boot if required config is missing, rather
// than surfacing as a confusing runtime error on first DB query or
// request. Per the roadmap's "minimize risk" principle for Step 1.
const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in real values before starting the server.'
    );
  }
}

validateEnv();

// Distinguishes dev/staging/prod per the Security & Deployment session
// - later steps (rate limiting, AI model tier defaults) read env.nodeEnv
// / env.isProduction rather than checking process.env directly.
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  isProduction: process.env.NODE_ENV === 'production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY,
};
