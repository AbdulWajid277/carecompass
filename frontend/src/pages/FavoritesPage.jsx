import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function FavoritesPage() {
  const { token, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await api.favorites(token);
        if (!cancelled) setResources(data.resources || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load favorites.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function removeFavorite(id) {
    try {
      await api.unfavorite(id, token);
      setResources((prev) => prev.filter((r) => r.id !== id));
      setMessage('Removed from favorites.');
    } catch (err) {
      setError(err.message || 'Could not remove favorite.');
    }
  }

  if (!user) {
    return (
      <div className="alert alert-info" role="status">
        Please <Link to="/login">sign in</Link> to view saved resources.
      </div>
    );
  }

  return (
    <section className="section" style={{ marginTop: 0 }} aria-labelledby="favorites-heading">
      <h2 id="favorites-heading">Your favorites</h2>
      <p className="section-lead">Saved community resources for quick access.</p>

      {message && (
        <div className="alert alert-info" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading" role="status">
          Loading favorites…
        </div>
      ) : resources.length === 0 ? (
        <div className="empty panel">
          No favorites yet. <Link to="/search">Search resources</Link> and save one.
        </div>
      ) : (
        <div className="resource-list">
          {resources.map((resource) => (
            <article key={resource.id} className="resource-item">
              <span className="badge">{resource.category}</span>
              <h3>
                <Link to={`/resources/${resource.id}`}>{resource.name}</Link>
              </h3>
              <p className="meta-line">
                {resource.organization} · {resource.city}, {resource.state}
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeFavorite(resource.id)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
