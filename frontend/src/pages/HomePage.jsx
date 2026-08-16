import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <>
      <section className="hero" aria-label="CareCompass introduction">
        <div>
          <h1 className="hero-brand">CareCompass</h1>
          <p>
            Find trusted local help for food, housing, healthcare, jobs, and more — explained in
            plain language, with sources you can verify.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/search">
              Search resources
            </Link>
            <Link className="btn btn-secondary" to="/assistant">
              Ask the AI guide
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <p className="section-lead">
          Tell us what you need. CareCompass searches verified community records and suggests clear
          next steps — without making eligibility decisions for you.
        </p>
        <div className="resource-list">
          <article className="resource-item">
            <span className="badge">Step 1</span>
            <h3>Share your need</h3>
            <p className="meta-line">
              Choose a category or describe your situation in everyday words.
            </p>
          </article>
          <article className="resource-item">
            <span className="badge">Step 2</span>
            <h3>Review matched resources</h3>
            <p className="meta-line">
              See hours, contact info, documents to bring, and when the listing was last verified.
            </p>
          </article>
          <article className="resource-item">
            <span className="badge">Step 3</span>
            <h3>Confirm and connect</h3>
            <p className="meta-line">
              Call or visit the organization to confirm details before you go.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
