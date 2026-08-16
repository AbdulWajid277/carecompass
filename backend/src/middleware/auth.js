import jwt from 'jsonwebtoken';
import db from '../db/database.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db
      .prepare('SELECT id, email, full_name, role, preferred_language FROM users WHERE id = ?')
      .get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = db
      .prepare('SELECT id, email, full_name, role, preferred_language FROM users WHERE id = ?')
      .get(payload.userId);
    if (user) req.user = user;
  } catch {
    // ignore invalid optional token
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action.' });
    }
    next();
  };
}
