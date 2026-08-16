import db from '../db/database.js';

const CATEGORIES = [
  'food',
  'housing',
  'healthcare',
  'employment',
  'transportation',
  'education',
  'legal',
];

function haversineMiles(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v == null || Number.isNaN(Number(v)))) {
    return null;
  }
  const toRad = (d) => (Number(d) * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function searchResources({
  q = '',
  category = '',
  city = '',
  language = '',
  lat,
  lng,
  radiusMiles = 25,
  limit = 50,
} = {}) {
  let sql = `SELECT * FROM resources WHERE is_active = 1`;
  const params = {};

  if (q.trim()) {
    sql += ` AND (
      name LIKE @q OR organization LIKE @q OR description LIKE @q
      OR eligibility LIKE @q OR city LIKE @q OR category LIKE @q
    )`;
    params.q = `%${q.trim()}%`;
  }

  if (category && CATEGORIES.includes(category)) {
    sql += ` AND category = @category`;
    params.category = category;
  }

  if (city.trim()) {
    sql += ` AND city LIKE @city`;
    params.city = `%${city.trim()}%`;
  }

  if (language.trim()) {
    sql += ` AND languages LIKE @language`;
    params.language = `%${language.trim()}%`;
  }

  sql += ` ORDER BY name ASC LIMIT @limit`;
  params.limit = Math.min(Number(limit) || 50, 100);

  let rows = db.prepare(sql).all(params);

  const userLat = lat != null && lat !== '' ? Number(lat) : null;
  const userLng = lng != null && lng !== '' ? Number(lng) : null;
  const radius = Number(radiusMiles) || 25;

  if (userLat != null && userLng != null && !Number.isNaN(userLat) && !Number.isNaN(userLng)) {
    rows = rows
      .map((r) => ({
        ...r,
        distance_miles: haversineMiles(userLat, userLng, r.latitude, r.longitude),
      }))
      .filter((r) => r.distance_miles == null || r.distance_miles <= radius)
      .sort((a, b) => {
        if (a.distance_miles == null) return 1;
        if (b.distance_miles == null) return -1;
        return a.distance_miles - b.distance_miles;
      });
  }

  return rows.map(formatResource);
}

export function getResourceById(id) {
  const row = db.prepare('SELECT * FROM resources WHERE id = ? AND is_active = 1').get(id);
  return row ? formatResource(row) : null;
}

export function getAllResourcesAdmin() {
  return db
    .prepare('SELECT * FROM resources ORDER BY updated_at DESC')
    .all()
    .map(formatResource);
}

export function createResource(data, userId) {
  const result = db
    .prepare(
      `INSERT INTO resources (
        name, organization, category, description, eligibility, documents_needed,
        address, city, state, zip, latitude, longitude, phone, email, website,
        hours, languages, source_url, last_verified_at, created_by
      ) VALUES (
        @name, @organization, @category, @description, @eligibility, @documents_needed,
        @address, @city, @state, @zip, @latitude, @longitude, @phone, @email, @website,
        @hours, @languages, @source_url, datetime('now'), @created_by
      )`
    )
    .run({ ...data, created_by: userId });
  return getResourceByIdAdmin(result.lastInsertRowid);
}

export function updateResource(id, data) {
  const existing = db.prepare('SELECT id FROM resources WHERE id = ?').get(id);
  if (!existing) return null;

  db.prepare(
    `UPDATE resources SET
      name = @name,
      organization = @organization,
      category = @category,
      description = @description,
      eligibility = @eligibility,
      documents_needed = @documents_needed,
      address = @address,
      city = @city,
      state = @state,
      zip = @zip,
      latitude = @latitude,
      longitude = @longitude,
      phone = @phone,
      email = @email,
      website = @website,
      hours = @hours,
      languages = @languages,
      source_url = @source_url,
      last_verified_at = @last_verified_at,
      is_active = @is_active,
      updated_at = datetime('now')
    WHERE id = @id`
  ).run({ ...data, id });

  return getResourceByIdAdmin(id);
}

export function getResourceByIdAdmin(id) {
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
  return row ? formatResource(row) : null;
}

export function retrieveForAi(question, limit = 5) {
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);

  const categoryHints = {
    food: ['food', 'pantry', 'meal', 'hungry', 'groceries', 'eat'],
    housing: ['housing', 'shelter', 'rent', 'eviction', 'homeless', 'apartment'],
    healthcare: ['health', 'clinic', 'doctor', 'medical', 'mental', 'dental'],
    employment: ['job', 'work', 'career', 'employment', 'resume', 'training'],
    transportation: ['bus', 'transit', 'ride', 'transport', 'fare'],
    education: ['school', 'ged', 'esl', 'class', 'education', 'learn'],
    legal: ['legal', 'lawyer', 'immigration', 'rights', 'court'],
  };

  let matchedCategory = '';
  for (const [cat, hints] of Object.entries(categoryHints)) {
    if (hints.some((h) => question.toLowerCase().includes(h))) {
      matchedCategory = cat;
      break;
    }
  }

  let rows = db.prepare('SELECT * FROM resources WHERE is_active = 1').all();

  const scored = rows.map((r) => {
    const hay = `${r.name} ${r.organization} ${r.category} ${r.description} ${r.eligibility} ${r.city} ${r.languages}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (hay.includes(term)) score += 1;
    }
    if (matchedCategory && r.category === matchedCategory) score += 5;
    return { ...r, score };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(formatResource);
}

export function formatResource(row) {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    category: row.category,
    description: row.description,
    eligibility: row.eligibility,
    documentsNeeded: row.documents_needed,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    email: row.email,
    website: row.website,
    hours: row.hours,
    languages: row.languages,
    sourceUrl: row.source_url,
    lastVerifiedAt: row.last_verified_at,
    isActive: Boolean(row.is_active),
    distanceMiles:
      row.distance_miles != null ? Math.round(row.distance_miles * 10) / 10 : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export { CATEGORIES };
