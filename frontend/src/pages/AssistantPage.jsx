import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function AssistantPage() {
  const { token, user } = useAuth();
  const [question, setQuestion] = useState('');
  const [language, setLanguage] = useState(user?.preferredLanguage || 'en');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask about food, housing, healthcare, jobs, transportation, education, or legal help. I only use verified CareCompass records and will not decide eligibility for you.',
    },
  ]);
  const [matched, setMatched] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    const trimmed = question.trim();
    if (trimmed.length < 5) {
      setError('Please enter a more complete question (at least 5 characters).');
      return;
    }

    setError('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuestion('');

    try {
      const data = await api.askAi({ question: trimmed, language }, token);
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }]);
      setMatched(data.resources || []);
    } catch (err) {
      setError(err.message || 'The assistant is unavailable right now.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry — I could not complete that request. Please try again or browse the resource search.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ marginTop: 0 }} aria-labelledby="assistant-heading">
      <h2 id="assistant-heading">AI community guide</h2>
      <p className="section-lead">
        Get plain-language next steps based on verified resources. Optional OpenAI key improves
        wording; without it, CareCompass still answers from its local knowledge base.
      </p>

      <div className="assistant-layout">
        <div className="panel">
          <div className="chat-log" aria-live="polite">
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="bubble assistant" role="status">
                Looking through verified resources…
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="question">Your question</label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Example: I need food assistance this week in Austin and speak Spanish."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="language">Answer language</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <button className="btn btn-solid" type="submit" disabled={loading}>
              {loading ? 'Thinking…' : 'Ask CareCompass'}
            </button>
          </form>
        </div>

        <aside className="panel">
          <h3 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Matched resources</h3>
          {matched.length === 0 ? (
            <p className="meta-line">Suggested resources will appear here after you ask.</p>
          ) : (
            <div className="resource-list">
              {matched.map((resource) => (
                <Link
                  key={resource.id}
                  to={`/resources/${resource.id}`}
                  className="resource-item"
                >
                  <span className="badge">{resource.category}</span>
                  <h3 style={{ fontSize: '1.05rem' }}>{resource.name}</h3>
                  <p className="meta-line">
                    {resource.city}, {resource.state} · Verified{' '}
                    {resource.lastVerifiedAt?.slice(0, 10)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
