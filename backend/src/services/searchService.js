import {
  findById,
  findMany,
  insert,
  nowIso,
  updateById,
} from '../db/jsonStore.js';

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

function includesInsensitive(haystack, needle) {
  return String(haystack || '')
    .toLowerCase()
    .includes(String(needle || '').toLowerCase());
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
  const qTrim = q.trim();
  const cityTrim = city.trim();
  const languageTrim = language.trim();
  const max = Math.min(Number(limit) || 50, 100);

  let rows = findMany('resources', (r) => r.is_active === 1 || r.is_active === true);

  if (qTrim) {
    rows = rows.filter(
      (r) =>
        includesInsensitive(r.name, qTrim) ||
        includesInsensitive(r.organization, qTrim) ||
        includesInsensitive(r.description, qTrim) ||
        includesInsensitive(r.eligibility, qTrim) ||
        includesInsensitive(r.city, qTrim) ||
        includesInsensitive(r.category, qTrim)
    );
  }

  if (category && CATEGORIES.includes(category)) {
    rows = rows.filter((r) => r.category === category);
  }

  if (cityTrim) {
    rows = rows.filter((r) => includesInsensitive(r.city, cityTrim));
  }

  if (languageTrim) {
    rows = rows.filter((r) => includesInsensitive(r.languages, languageTrim));
  }

  rows = [...rows].sort((a, b) => String(a.name).localeCompare(String(b.name)));

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

  return rows.slice(0, max).map(formatResource);
}

export function getResourceById(id) {
  const row = findById('resources', id);
  if (!row || !(row.is_active === 1 || row.is_active === true)) return null;
  return formatResource(row);
}

export function getAllResourcesAdmin() {
  return findMany('resources')
    .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
    .map(formatResource);
}

export function createResource(data, userId) {
  const created = nowIso();
  const row = insert('resources', {
    ...data,
    last_verified_at: data.last_verified_at || created,
    is_active: data.is_active === false || data.is_active === 0 ? 0 : 1,
    created_by: userId,
    created_at: created,
    updated_at: created,
  });
  return getResourceByIdAdmin(row.id);
}

export function updateResource(id, data) {
  const existing = findById('resources', id);
  if (!existing) return null;

  updateById('resources', id, {
    ...data,
    is_active: data.is_active === false || data.is_active === 0 ? 0 : 1,
    updated_at: nowIso(),
  });

  return getResourceByIdAdmin(id);
}

export function getResourceByIdAdmin(id) {
  const row = findById('resources', id);
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

  const rows = findMany('resources', (r) => r.is_active === 1 || r.is_active === true);

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
