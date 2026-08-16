import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel alert alert-error" role="alert" style={{ margin: '2rem auto', maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Something went wrong</h2>
          <p>The page crashed unexpectedly. You can reload and continue using CareCompass.</p>
          <p className="meta-line">{this.state.message}</p>
          <button type="button" className="btn btn-solid" onClick={() => window.location.assign('/')}>
            Return home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
