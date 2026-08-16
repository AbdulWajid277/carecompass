import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  CATEGORIES,
  createResource,
  getAllResourcesAdmin,
  getResourceByIdAdmin,
  updateResource,
} from '../services/searchService.js';
import { sanitizeObject, sanitizeText } from '../middleware/sanitize.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'volunteer'));

const optionalUrl = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional();
const optionalEmail = z
  .union([z.string().email(), z.literal(''), z.null()])
  .optional();

const resourceSchema = z.object({
  name: z.string().min(2).max(200),
  organization: z.string().min(2).max(200),
  category: z.enum(CATEGORIES),
  description: z.string().min(10).max(4000),
  eligibility: z.string().max(2000).optional().nullable(),
  documentsNeeded: z.string().max(2000).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(2).default('TX'),
  zip: z.string().max(20).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: optionalEmail,
  website: optionalUrl,
  hours: z.string().max(500).optional().nullable(),
  languages: z.string().max(200).optional().default('English'),
  sourceUrl: optionalUrl,
  lastVerifiedAt: z.string().max(40).optional(),
  isActive: z.boolean().optional().default(true),
});

function toDb(data) {
  const clean = sanitizeObject(data, [
    'name',
    'organization',
    'description',
    'eligibility',
    'documentsNeeded',
    'address',
    'city',
    'state',
    'zip',
    'phone',
    'email',
    'website',
    'hours',
    'languages',
    'sourceUrl',
  ]);

  return {
    name: clean.name,
    organization: clean.organization,
    category: clean.category,
    description: clean.description,
    eligibility: clean.eligibility || null,
    documents_needed: clean.documentsNeeded || null,
    address: clean.address || null,
    city: clean.city,
    state: (clean.state || 'TX').toUpperCase(),
    zip: clean.zip || null,
    latitude: clean.latitude ?? null,
    longitude: clean.longitude ?? null,
    phone: clean.phone || null,
    email: clean.email || null,
    website: clean.website || null,
    hours: clean.hours || null,
    languages: clean.languages || 'English',
    source_url: clean.sourceUrl || null,
    last_verified_at: sanitizeText(clean.lastVerifiedAt || new Date().toISOString(), {
      maxLength: 40,
    }),
    is_active: clean.isActive === false ? 0 : 1,
  };
}

router.get('/stats', (_req, res) => {
  const totals = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM resources) AS resources,
        (SELECT COUNT(*) FROM resources WHERE is_active = 1) AS activeResources,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM ai_conversations) AS aiQuestions`
    )
    .get();

  const byCategory = db
    .prepare(
      `SELECT category, COUNT(*) AS count
       FROM resources WHERE is_active = 1
       GROUP BY category ORDER BY count DESC`
    )
    .all();

  res.json({ totals, byCategory });
});

router.get('/resources', (_req, res) => {
  res.json({ resources: getAllResourcesAdmin() });
});

router.post('/resources', (req, res, next) => {
  try {
    const parsed = resourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const resource = createResource(toDb(parsed.data), req.user.id);
    res.status(201).json({ resource });
  } catch (err) {
    next(err);
  }
});

router.put('/resources/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource id.' });
    }

    const parsed = resourceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }

    const resource = updateResource(id, toDb(parsed.data));
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    res.json({ resource });
  } catch (err) {
    next(err);
  }
});

router.get('/resources/:id', (req, res) => {
  const resource = getResourceByIdAdmin(Number(req.params.id));
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  res.json({ resource });
});

export default router;
