import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initSchema } from './db/database.js';
import { count } from './db/jsonStore.js';
import { seedIfEmpty } from './db/seed.js';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import aiRoutes from './routes/ai.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import {
  applySecurityMiddleware,
  requireStrongJwtSecret,
} from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// App Runner / production: provide a strong default only if unset (prefer env var)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET =
    process.env.APP_JWT_SECRET ||
    'CareCompass_AppRunner_Prod_9f3a7c2e8b1d4e6f0a5c9b7d3e1f8a2c';
}

try {
  requireStrongJwtSecret();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

try {
  initSchema();
} catch (err) {
  console.error('[startup] schema init failed:', err);
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Required behind App Runner / reverse proxies for correct rate-limit IPs
app.set('trust proxy', 1);

function healthPayload() {
  return {
    status: 'ok',
    app: 'CareCompass',
    resources: count('resources'),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY),
  };
}

// Register before rate limiting so App Runner health checks always succeed
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json(healthPayload());
});

applySecurityMiddleware(app);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigin === '*' ||
        origin === allowedOrigin ||
        (isProd && allowedOrigin === '*')
      ) {
        return callback(null, true);
      }
      // Same-origin deployments (API + static UI together) do not send cross-origin needs
      return callback(new Error('CORS: origin not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Serve Vite build in production (App Runner single-service deploy)
const clientDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next();
    });
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CareCompass running at http://0.0.0.0:${PORT}`);
  console.log(`Static UI: ${fs.existsSync(clientDist) ? 'enabled' : 'not found (API only)'}`);
  try {
    seedIfEmpty();
    console.log(`Seeded resources: ${count('resources')}`);
  } catch (err) {
    console.error('[startup] seed failed:', err);
  }
});
