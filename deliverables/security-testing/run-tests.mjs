/**
 * CareCompass automated API feature + security smoke tests.
 * Run: node deliverables/security-testing/run-tests.mjs
 */
const API = process.env.API_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    results.push({ name, status: 'PASS' });
    console.log(`PASS  ${name}`);
  } catch (err) {
    failed += 1;
    results.push({ name, status: 'FAIL', error: err.message });
    console.error(`FAIL  ${name} -> ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

async function json(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log(`Testing ${API}\n`);

  await test('Health endpoint responds', async () => {
    const { res, data } = await json('/health');
    assert(res.ok, 'health not ok');
    assert(data.app === 'CareCompass', 'wrong app name');
  });

  await test('Search returns resources for Austin food', async () => {
    const { res, data } = await json('/resources?city=Austin&category=food');
    assert(res.ok, 'search failed');
    assert(data.count >= 1, 'expected food resources');
  });

  await test('Invalid resource id returns 400/404 safely', async () => {
    const { res } = await json('/resources/not-a-number');
    assert(res.status === 400 || res.status === 404, 'expected client error');
  });

  await test('Login rejects invalid credentials', async () => {
    const { res, data } = await json('/auth/login', {
      method: 'POST',
      body: { email: 'maria@example.com', password: 'wrong-password' },
    });
    assert(res.status === 401, 'expected 401');
    assert(data.error, 'expected error message');
  });

  await test('Login accepts valid demo user', async () => {
    const { res, data } = await json('/auth/login', {
      method: 'POST',
      body: { email: 'maria@example.com', password: 'password123' },
    });
    assert(res.ok, 'login failed');
    assert(data.token, 'missing token');
    globalThis.__userToken = data.token;
  });

  await test('Register rejects weak password', async () => {
    const { res } = await json('/auth/register', {
      method: 'POST',
      body: {
        email: `weak${Date.now()}@example.com`,
        password: 'short',
        fullName: 'Weak Pass',
      },
    });
    assert(res.status === 400, 'expected validation failure');
  });

  await test('AI ask rejects tiny question', async () => {
    const { res } = await json('/ai/ask', {
      method: 'POST',
      body: { question: 'hi', language: 'en' },
    });
    assert(res.status === 400, 'expected validation failure');
  });

  await test('AI ask returns retrieval answer for food help', async () => {
    const { res, data } = await json('/ai/ask', {
      method: 'POST',
      body: {
        question: 'I need food assistance in Austin this week',
        language: 'en',
      },
    });
    assert(res.ok, 'ai ask failed');
    assert(data.answer && data.answer.length > 20, 'missing answer');
    assert(
      /confirm|eligib|organiz/i.test(data.answer),
      'expected responsible AI disclaimer language'
    );
  });

  await test('Admin route blocked without auth', async () => {
    const { res } = await json('/admin/stats');
    assert(res.status === 401, 'expected unauthorized');
  });

  await test('Admin login and dashboard access', async () => {
    const { res, data } = await json('/auth/login', {
      method: 'POST',
      body: { email: 'admin@carecompass.org', password: 'admin123' },
    });
    assert(res.ok, 'admin login failed');
    const stats = await json('/admin/stats', { token: data.token });
    assert(stats.res.ok, 'admin stats failed');
    assert(stats.data.totals.activeResources >= 1, 'no resources in stats');
    globalThis.__adminToken = data.token;
  });

  await test('Favorite save works for logged-in user', async () => {
    const token = globalThis.__userToken;
    assert(token, 'missing user token');
    const fav = await json('/resources/1/favorite', { method: 'POST', token });
    assert(fav.res.ok, 'favorite failed');
    const list = await json('/resources/favorites', { token });
    assert(list.res.ok, 'favorites list failed');
    assert(Array.isArray(list.data.resources), 'favorites not array');
  });

  await test('SQL injection style search does not crash', async () => {
    const payload = encodeURIComponent("'; DROP TABLE resources; --");
    const { res, data } = await json(`/resources?q=${payload}`);
    assert(res.ok, 'search crashed on injection-like input');
    assert(typeof data.count === 'number', 'unexpected response shape');
  });

  await test('XSS-like AI question is sanitized/handled safely', async () => {
    const { res, data } = await json('/ai/ask', {
      method: 'POST',
      body: {
        question: '<script>alert(1)</script> food pantry help please',
        language: 'en',
      },
    });
    assert(res.ok, 'ai ask failed on xss-like input');
    assert(!data.answer.includes('<script>'), 'script tags should not remain');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
