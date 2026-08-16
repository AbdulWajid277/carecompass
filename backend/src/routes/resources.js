import { Router } from 'express';
import {
  findById,
  findMany,
  insertFavorite,
  removeWhere,
} from '../db/jsonStore.js';
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
  const favs = findMany('favorites', (f) => f.user_id === req.user.id).sort((a, b) =>
    String(b.created_at || '').localeCompare(String(a.created_at || ''))
  );

  const rows = favs
    .map((f) => findById('resources', f.resource_id))
    .filter((r) => r && (r.is_active === 1 || r.is_active === true));

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
  insertFavorite({ user_id: req.user.id, resource_id: resource.id });
  res.json({ ok: true, message: 'Saved to your favorites.' });
});

router.delete('/:id/favorite', authenticate, (req, res) => {
  removeWhere(
    'favorites',
    (f) => f.user_id === req.user.id && f.resource_id === Number(req.params.id)
  );
  res.json({ ok: true, message: 'Removed from favorites.' });
});

export default router;
