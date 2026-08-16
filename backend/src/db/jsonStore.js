import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDataDir() {
  const candidates = [
    process.env.DATA_DIR,
    process.env.NODE_ENV === 'production' ? '/tmp/carecompass-data' : null,
    path.join(__dirname, '../../data'),
    '/tmp/carecompass-data',
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      // try next writable location (App Runner / Cloud Run often only allow /tmp)
    }
  }
  return candidates[0];
}

export const dataDir = resolveDataDir();
export const storePath = path.join(dataDir, 'carecompass.json');

const COLLECTIONS = ['users', 'resources', 'favorites', 'ai_conversations'];

function emptyStore() {
  return {
    users: [],
    resources: [],
    favorites: [],
    ai_conversations: [],
    _meta: {
      users: 0,
      resources: 0,
      favorites: 0,
      ai_conversations: 0,
    },
  };
}

function ensureShape(raw) {
  const store = emptyStore();
  for (const name of COLLECTIONS) {
    store[name] = Array.isArray(raw?.[name]) ? raw[name] : [];
    const maxId = store[name].reduce((max, row) => {
      const id = Number(row?.id) || 0;
      return id > max ? id : max;
    }, 0);
    const metaVal = Number(raw?._meta?.[name]) || 0;
    store._meta[name] = Math.max(metaVal, maxId);
  }
  return store;
}

let data = emptyStore();

function persist() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[jsonStore] persist failed (${storePath}):`, err.message);
  }
}

export function nowIso() {
  return new Date().toISOString();
}

export function initStore() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.error(`[jsonStore] mkdir failed (${dataDir}):`, err.message);
  }
  if (!fs.existsSync(storePath)) {
    data = emptyStore();
    persist();
    return data;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    data = ensureShape(raw);
  } catch {
    data = emptyStore();
    persist();
  }
  return data;
}

export function getStore() {
  return data;
}

export function count(collection, predicate) {
  const rows = data[collection] || [];
  if (!predicate) return rows.length;
  return rows.filter(predicate).length;
}

export function findById(collection, id) {
  const numId = Number(id);
  return (data[collection] || []).find((row) => row.id === numId) || null;
}

export function findOne(collection, predicate) {
  return (data[collection] || []).find(predicate) || null;
}

export function findMany(collection, predicate) {
  const rows = data[collection] || [];
  return predicate ? rows.filter(predicate) : [...rows];
}

export function insert(collection, record) {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`Unknown collection: ${collection}`);
  }
  data._meta[collection] += 1;
  const row = { ...record, id: data._meta[collection] };
  data[collection].push(row);
  persist();
  return row;
}

export function insertFavorite({ user_id, resource_id }) {
  const existing = data.favorites.find(
    (f) => f.user_id === user_id && f.resource_id === resource_id
  );
  if (existing) return existing;

  data._meta.favorites += 1;
  const row = {
    id: data._meta.favorites,
    user_id,
    resource_id,
    created_at: nowIso(),
  };
  data.favorites.push(row);
  persist();
  return row;
}

export function updateById(collection, id, patch) {
  const numId = Number(id);
  const rows = data[collection] || [];
  const idx = rows.findIndex((row) => row.id === numId);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...patch, id: numId };
  persist();
  return rows[idx];
}

export function removeWhere(collection, predicate) {
  const rows = data[collection] || [];
  const next = rows.filter((row) => !predicate(row));
  const removed = rows.length - next.length;
  data[collection] = next;
  if (removed > 0) persist();
  return removed;
}

export function groupCount(collection, key, predicate) {
  const rows = predicate ? findMany(collection, predicate) : findMany(collection);
  const counts = new Map();
  for (const row of rows) {
    const value = row[key];
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
