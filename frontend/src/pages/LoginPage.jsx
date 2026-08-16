import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!email.includes('@') || password.length < 1) {
      setError('Enter a valid email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'admin' || user.role === 'volunteer' ? '/admin' : '/search');
    } catch (err) {
      setError(err.details?.join?.(' ') || err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section auth-card" style={{ marginTop: 0 }} aria-labelledby="login-heading">
      <h2 id="login-heading">Sign in</h2>
      <p className="section-lead">Access favorites and, for staff, the admin dashboard.</p>
      <form className="panel" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>
        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div id="login-error" className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-solid" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="meta-line" style={{ marginTop: '1rem' }}>
          Workshop demo accounts (type manually): maria@example.com / password123 ·
          admin@carecompass.org / admin123
        </p>
        <p className="meta-line">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  );
}
