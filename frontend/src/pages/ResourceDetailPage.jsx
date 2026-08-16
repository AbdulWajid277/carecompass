import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ResourceDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getResource(id);
        if (!cancelled) setResource(data.resource);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Resource not found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function saveFavorite() {
    if (!token) {
      setMessage('Sign in to save favorites.');
      return;
    }
    try {
      const data = await api.favorite(id, token);
      setMessage(data.message);
    } catch (err) {
      setMessage(err.message || 'Could not save favorite.');
    }
  }

  if (loading) {
    return (
      <div className="loading" role="status">
        Loading resource details…
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="alert alert-error" role="alert">
        {error || 'Resource not found.'}{' '}
        <Link to="/search">Back to search</Link>
      </div>
    );
  }

  const docs = (resource.documentsNeeded || '')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean);

  return (
    <div className="detail-layout">
      <article className="detail-hero">
        <span className="badge">{resource.category}</span>
        <h1>{resource.name}</h1>
        <p className="meta-line">
          {resource.organization} · {resource.city}, {resource.state} {resource.zip}
        </p>
        <p>{resource.description}</p>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>
          Eligibility notes
        </h2>
        <p>{resource.eligibility || 'Contact the organization to confirm eligibility.'}</p>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>
          Documents checklist
        </h2>
        {docs.length ? (
          <ul className="checklist">
            {docs.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        ) : (
          <p>No specific documents listed. Ask the organization what to bring.</p>
        )}

        <div className="alert alert-warn" role="note">
          CareCompass does not decide eligibility. Confirm hours, requirements, and availability
          directly with this organization before visiting.
        </div>

        <div className="hero-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-solid" onClick={saveFavorite}>
            {user ? 'Save to favorites' : 'Sign in to save'}
          </button>
          <Link className="btn btn-ghost" to="/search">
            Back to search
          </Link>
        </div>
        {message && (
          <div className="alert alert-info" role="status">
            {message}
          </div>
        )}
      </article>

      <aside className="panel">
        <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Next steps</h2>
        <p className="meta-line">
          <strong>Address:</strong> {resource.address || 'See organization for location'}
        </p>
        <p className="meta-line">
          <strong>Hours:</strong> {resource.hours || 'Contact for hours'}
        </p>
        <p className="meta-line">
          <strong>Phone:</strong>{' '}
          {resource.phone ? <a href={`tel:${resource.phone}`}>{resource.phone}</a> : 'Not listed'}
        </p>
        <p className="meta-line">
          <strong>Email:</strong>{' '}
          {resource.email ? (
            <a href={`mailto:${resource.email}`}>{resource.email}</a>
          ) : (
            'Not listed'
          )}
        </p>
        <p className="meta-line">
          <strong>Languages:</strong> {resource.languages}
        </p>
        <p className="meta-line">
          <strong>Website:</strong>{' '}
          {resource.website ? (
            <a href={resource.website} target="_blank" rel="noreferrer">
              Visit site
            </a>
          ) : (
            'Not listed'
          )}
        </p>
        <p className="meta-line">
          <strong>Source:</strong>{' '}
          {resource.sourceUrl ? (
            <a href={resource.sourceUrl} target="_blank" rel="noreferrer">
              View source
            </a>
          ) : (
            'CareCompass local record'
          )}
        </p>
        <p className="meta-line">
          <strong>Last verified:</strong> {resource.lastVerifiedAt?.slice(0, 10)}
        </p>
      </aside>
    </div>
  );
}
