import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { findById, findOne, insert, nowIso } from '../db/jsonStore.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { sanitizeText } from '../middleware/sanitize.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must include a letter')
    .regex(/[0-9]/, 'Password must include a number'),
  fullName: z.string().min(2, 'Full name is required').max(120),
  preferredLanguage: z.enum(['en', 'es']).optional().default('en'),
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    preferredLanguage: user.preferred_language,
  };
}

router.post('/register', authLimiter, (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const email = sanitizeText(parsed.data.email, { maxLength: 254 }).toLowerCase();
    const fullName = sanitizeText(parsed.data.fullName, { maxLength: 120 });
    const { password, preferredLanguage } = parsed.data;

    const existing = findOne(
      'users',
      (u) => String(u.email).toLowerCase() === email
    );
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const created = insert('users', {
      email,
      password_hash: passwordHash,
      full_name: fullName,
      role: 'user',
      preferred_language: preferredLanguage,
      created_at: nowIso(),
    });

    const user = findById('users', created.id);
    const token = signToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to register right now. Please try again.' });
  }
});

router.post('/login', authLimiter, (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const email = sanitizeText(parsed.data.email, { maxLength: 254 }).toLowerCase();
    const { password } = parsed.data;

    const user = findOne(
      'users',
      (u) => String(u.email).toLowerCase() === email
    );
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to sign in right now. Please try again.' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
