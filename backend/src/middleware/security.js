import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export function applySecurityMiddleware(app) {
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: false, // API-only; frontend is separate Vite app
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Basic abuse protection for all API routes
  app.use(
    '/api/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 500,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests. Please try again later.' },
    })
  );
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login or registration attempts. Please wait and try again.' },
});

export function requireStrongJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error(
      'JWT_SECRET is missing or too weak. Set a secret of at least 24 characters in backend/.env'
    );
  }
  if (
    secret.includes('change-in-production') ||
    secret === 'carecompass-dev-secret-change-in-production'
  ) {
    console.warn(
      '[security] JWT_SECRET still uses the default workshop value. Rotate it before any public deployment.'
    );
  }
}
