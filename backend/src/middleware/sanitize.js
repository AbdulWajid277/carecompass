/**
 * Lightweight sanitization for user-provided text.
 * Strips HTML tags and control characters to reduce XSS stored in the DB.
 */
export function sanitizeText(value, { maxLength = 5000 } = {}) {
  if (value == null) return value;
  let text = String(value);
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  text = text.trim();
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}

export function sanitizeObject(obj, fields) {
  const next = { ...obj };
  for (const field of fields) {
    if (next[field] != null && typeof next[field] === 'string') {
      next[field] = sanitizeText(next[field]);
    }
  }
  return next;
}
