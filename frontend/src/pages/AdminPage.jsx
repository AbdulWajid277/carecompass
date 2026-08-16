import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  name: '',
  organization: '',
  category: 'food',
  description: '',
  eligibility: '',
  documentsNeeded: '',
  address: '',
  city: 'Austin',
  state: 'TX',
  zip: '',
  phone: '',
  email: '',
  website: '',
  hours: '',
  languages: 'English',
  sourceUrl: '',
  isActive: true,
};

export default function AdminPage() {
  const { token, user, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [statsData, resourcesData] = await Promise.all([
        api.adminStats(token),
        api.adminResources(token),
      ]);
      setStats(statsData);
      setResources(resourcesData.resources);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    load();
  }, [authLoading, isAdmin, token]);

  function startEdit(resource) {
    setEditingId(resource.id);
    setForm({
      name: resource.name || '',
      organization: resource.organization || '',
      category: resource.category || 'food',
      description: resource.description || '',
      eligibility: resource.eligibility || '',
      documentsNeeded: resource.documentsNeeded || '',
      address: resource.address || '',
      city: resource.city || '',
      state: resource.state || 'TX',
      zip: resource.zip || '',
      phone: resource.phone || '',
      email: resource.email || '',
      website: resource.website || '',
      hours: resource.hours || '',
      languages: resource.languages || 'English',
      sourceUrl: resource.sourceUrl || '',
      isActive: resource.isActive !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...form,
        email: form.email || null,
        website: form.website || null,
        sourceUrl: form.sourceUrl || null,
      };
      if (editingId) {
        await api.updateResource(editingId, payload, token);
        setMessage('Resource updated.');
      } else {
        await api.createResource(payload, token);
        setMessage('Resource created.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.details?.join(' ') || err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return <div className="loading">Checking access…</div>;
  }

  if (!user) {
    return (
      <div className="alert alert-info">
        Please <Link to="/login">sign in</Link> with an admin or volunteer account.
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-error" role="alert">
        Your account does not have dashboard access.
      </div>
    );
  }

  return (
    <section className="section" style={{ marginTop: 0 }} aria-labelledby="admin-heading">
      <h2 id="admin-heading">Administrator dashboard</h2>
      <p className="section-lead">
        Maintain verified resource records used by search and the AI guide.
      </p>

      {loading ? (
        <div className="loading">Loading dashboard…</div>
      ) : (
        <>
          {stats && (
            <div className="stats-row">
              <div className="stat">
                <strong>{stats.totals.activeResources}</strong>
                Active resources
              </div>
              <div className="stat">
                <strong>{stats.totals.users}</strong>
                Users
              </div>
              <div className="stat">
                <strong>{stats.totals.aiQuestions}</strong>
                AI questions
              </div>
            </div>
          )}

          <form className="panel" onSubmit={onSubmit}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
              {editingId ? 'Edit resource' : 'Add resource'}
            </h3>
            <div className="form-grid">
              {[
                ['name', 'Resource name'],
                ['organization', 'Organization'],
                ['city', 'City'],
                ['state', 'State'],
                ['zip', 'ZIP'],
                ['address', 'Address'],
                ['phone', 'Phone'],
                ['email', 'Email'],
                ['website', 'Website'],
                ['hours', 'Hours'],
                ['languages', 'Languages'],
                ['sourceUrl', 'Source URL'],
              ].map(([key, label]) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required={['name', 'organization', 'city', 'state'].includes(key)}
                  />
                </div>
              ))}
              <div className="field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {['food', 'housing', 'healthcare', 'employment', 'transportation', 'education', 'legal'].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="eligibility">Eligibility</label>
                <textarea
                  id="eligibility"
                  value={form.eligibility}
                  onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="documentsNeeded">Documents needed</label>
                <input
                  id="documentsNeeded"
                  value={form.documentsNeeded}
                  onChange={(e) => setForm({ ...form, documentsNeeded: e.target.value })}
                  placeholder="Separate items with semicolons"
                />
              </div>
            </div>
            <label style={{ display: 'inline-flex', gap: '0.5rem', marginTop: '0.8rem' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active listing
            </label>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="alert alert-info" role="status">
                {message}
              </div>
            )}
            <div className="hero-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-solid" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update resource' : 'Create resource'}
              </button>
              {editingId && (
                <button className="btn btn-ghost" type="button" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="panel" style={{ marginTop: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>All resources</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>City</th>
                    <th>Verified</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td>
                        <strong>{resource.name}</strong>
                        <div className="meta-line">{resource.organization}</div>
                      </td>
                      <td>{resource.category}</td>
                      <td>{resource.city}</td>
                      <td>{resource.lastVerifiedAt?.slice(0, 10)}</td>
                      <td>{resource.isActive ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => startEdit(resource)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
