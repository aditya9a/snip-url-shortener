import dotenv from 'dotenv';

// Load .env file into process.env
// This must happen BEFORE we read any env vars
dotenv.config();

const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/snip',

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Client
  // Render supplies RENDER_EXTERNAL_URL automatically at runtime. CLIENT_URL
  // still takes priority so custom domains can be configured explicitly.
  clientUrl: process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
  // Canonical origin used in QR codes and other public short-link URLs.
  // Set SHORT_URL_BASE_URL for a custom domain; Render's service URL is the
  // production fallback. Locally, short links are served by Express on PORT.
  shortUrlBaseUrl: process.env.SHORT_URL_BASE_URL || process.env.RENDER_EXTERNAL_URL ||
    (process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || 'http://localhost:5000'
      : `http://localhost:${process.env.PORT || 5000}`),

  // Derived
  get isDev() {
    return this.nodeEnv === 'development';
  },
  get isProd() {
    return this.nodeEnv === 'production';
  },
};

// Validate critical configuration at startup
// Fail fast — don't let the server start with missing secrets
if (!config.jwtSecret) {
  console.error('FATAL: JWT_SECRET is not set in environment variables.');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

if (!config.mongodbUri) {
  console.error('FATAL: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

export default config;
