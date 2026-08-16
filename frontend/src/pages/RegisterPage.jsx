import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    preferredLanguage: 'en',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (form.fullName.trim().length < 2) next.fullName = 'Enter your full name.';
    if (!form.email.includes('@')) next.email = 'Enter a valid email.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      next.password = 'Password must include a letter and a number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        preferredLanguage: form.preferredLanguage,
      });
      navigate('/search');
    } catch (err) {
      setError(err.details?.join(' ') || err.message || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section auth-card" style={{ marginTop: 0 }} aria-labelledby="register-heading">
      <h2 id="register-heading">Create your account</h2>
      <p className="section-lead">Save resources and personalize your CareCompass experience.</p>
      <form className="panel" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>
        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            aria-describedby="password-help"
            aria-invalid={Boolean(errors.password)}
          />
          <span id="password-help" className="meta-line">
            At least 8 characters, including a letter and a number.
          </span>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <div className="field" style={{ marginTop: '0.9rem' }}>
          <label htmlFor="preferredLanguage">Preferred language</label>
          <select
            id="preferredLanguage"
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-solid" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
        <p className="meta-line" style={{ marginTop: '1rem' }}>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
