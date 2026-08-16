import { Router } from 'express';
import db from '../db/database.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import {
  CATEGORIES,
  formatResource,
  getResourceById,
  searchResources,
} from '../services/searchService.js';

const router = Router();

router.get('/categories', (_req, res) => {
  res.json({
    categories: CATEGORIES.map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
    })),
  });
});

router.get('/favorites', authenticate, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.* FROM resources r
       INNER JOIN favorites f ON f.resource_id = r.id
       WHERE f.user_id = ? AND r.is_active = 1
       ORDER BY f.created_at DESC`
    )
    .all(req.user.id);
  res.json({ resources: rows.map(formatResource) });
});

router.get('/', optionalAuth, (req, res) => {
  const results = searchResources({
    q: req.query.q || '',
    category: req.query.category || '',
    city: req.query.city || '',
    language: req.query.language || '',
    lat: req.query.lat,
    lng: req.query.lng,
    radiusMiles: req.query.radius || 25,
    limit: req.query.limit || 50,
  });
  res.json({ count: results.length, resources: results });
});

router.get('/:id', optionalAuth, (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid resource id.' });
  }
  const resource = getResourceById(id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  res.json({ resource });
});

router.post('/:id/favorite', authenticate, (req, res) => {
  const resource = getResourceById(Number(req.params.id));
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }
  db.prepare(
    `INSERT OR IGNORE INTO favorites (user_id, resource_id) VALUES (?, ?)`
  ).run(req.user.id, resource.id);
  res.json({ ok: true, message: 'Saved to your favorites.' });
});

router.delete('/:id/favorite', authenticate, (req, res) => {
  db.prepare(`DELETE FROM favorites WHERE user_id = ? AND resource_id = ?`).run(
    req.user.id,
    Number(req.params.id)
  );
  res.json({ ok: true, message: 'Removed from favorites.' });
});

export default router;
