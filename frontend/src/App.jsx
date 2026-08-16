import { NavLink, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import AssistantPage from './pages/AssistantPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import FavoritesPage from './pages/FavoritesPage';

function navClass({ isActive }) {
  return isActive ? 'active' : undefined;
}

function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header">
        <div className="nav-inner">
          <NavLink to="/" className="brand" aria-label="CareCompass home">
            <span className="brand-mark" aria-hidden="true">
              ◆
            </span>
            CareCompass
          </NavLink>
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/search" className={navClass}>
              Find help
            </NavLink>
            <NavLink to="/assistant" className={navClass}>
              AI guide
            </NavLink>
            {user && (
              <NavLink to="/favorites" className={navClass}>
                Favorites
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Dashboard
              </NavLink>
            )}
            {user ? (
              <>
                <span className="meta-line" style={{ margin: '0 0.4rem' }} aria-live="polite">
                  {user.fullName}
                </span>
                <button type="button" className="linkish" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Sign in
                </NavLink>
                <NavLink to="/register" className={navClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer">
        <p>
          CareCompass connects people with verified community resources. Always confirm hours,
          eligibility, and documents with the organization.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="*"
          element={
            <div className="alert alert-error" role="alert">
              Page not found. <a href="/">Go home</a>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}
