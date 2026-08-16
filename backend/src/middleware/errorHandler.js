export function errorHandler(err, _req, res, _next) {
  console.error(err);

  if (err?.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: 'Request blocked by CORS policy.' });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(status).json({
    error: status >= 500 && isProd ? 'Unexpected server error.' : err.message || 'Unexpected server error.',
    details: !isProd && err.details ? err.details : undefined,
  });
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found.' });
}
