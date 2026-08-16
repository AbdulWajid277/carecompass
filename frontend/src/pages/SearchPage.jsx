import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

const CATEGORY_LABELS = {
  food: 'Food',
  housing: 'Housing',
  healthcare: 'Healthcare',
  employment: 'Employment',
  transportation: 'Transportation',
  education: 'Education',
  legal: 'Legal',
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [resources, setResources] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || 'Austin',
    language: searchParams.get('language') || '',
  });

  useEffect(() => {
    api.categories().then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError('');
      try {
        const params = {
          q: searchParams.get('q') || '',
          category: searchParams.get('category') || '',
          city: searchParams.get('city') || '',
          language: searchParams.get('language') || '',
        };
        const data = await api.searchResources(params);
        if (!cancelled) {
          setResources(data.resources);
          setCount(data.count);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load resources.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  function submit(event) {
    event.preventDefault();
    const next = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value) next[key] = value;
    });
    setSearchParams(next);
  }

  function selectCategory(id) {
    const next = { ...form, category: form.category === id ? '' : id };
    setForm(next);
    const params = {};
    Object.entries(next).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    setSearchParams(params);
  }

  return (
    <section className="section" style={{ marginTop: 0 }} aria-labelledby="search-heading">
      <h2 id="search-heading">Find community resources</h2>
      <p className="section-lead">
        Filter by need, city, or language. Results come from CareCompass verified records.
      </p>

      <form className="search-panel" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="q">What do you need?</label>
            <input
              id="q"
              name="q"
              value={form.q}
              onChange={(e) => setForm({ ...form, q: e.target.value })}
              placeholder="e.g. food pantry near me"
            />
          </div>
          <div className="field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Austin"
            />
          </div>
          <div className="field">
            <label htmlFor="language">Preferred language</label>
            <select
              id="language"
              name="language"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            >
              <option value="">Any</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Arabic">Arabic</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Mandarin">Mandarin</option>
              <option value="ASL">ASL</option>
            </select>
          </div>
        </div>

        <div className="category-row" role="group" aria-label="Resource categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`chip ${form.category === cat.id ? 'active' : ''}`}
              onClick={() => selectCategory(cat.id)}
              aria-pressed={form.category === cat.id}
            >
              {CATEGORY_LABELS[cat.id] || cat.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-solid" type="submit">
            Search
          </button>
        </div>
      </form>

      <div className="results-meta">
        <p>{loading ? 'Searching…' : `${count} resource${count === 1 ? '' : 's'} found`}</p>
        <Link className="btn btn-ghost" to="/assistant">
          Need help asking? Try the AI guide
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading" role="status">
          Loading resources…
        </div>
      ) : resources.length === 0 ? (
        <div className="empty panel">
          No matching resources yet. Try another category or ask the AI guide.
        </div>
      ) : (
        <div className="resource-list">
          {resources.map((resource) => (
            <Link
              key={resource.id}
              to={`/resources/${resource.id}`}
              className="resource-item"
            >
              <span className="badge">{CATEGORY_LABELS[resource.category] || resource.category}</span>
              <h3>{resource.name}</h3>
              <p className="meta-line">
                {resource.organization} · {resource.city}, {resource.state}
              </p>
              <p className="meta-line">{resource.description}</p>
              <p className="meta-line">
                Verified {resource.lastVerifiedAt?.slice(0, 10)}
                {resource.distanceMiles != null ? ` · ~${resource.distanceMiles} mi` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
