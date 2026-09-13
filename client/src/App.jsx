import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

// Layout Component (Navbar + Content area)
const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container flex items-center justify-between" style={{ height: '4rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.25rem' }}>
            Snip
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-secondary text-sm">Hello, {user.name}</span>
                <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
                <button onClick={handleLogout} className="btn btn-secondary text-danger">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Log in</Link>
                <Link to="/register" className="btn btn-primary">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container flex-col" style={{ flex: 1, padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  );
};

// Placeholder Pages
const Home = () => (
  <div className="flex flex-col items-center justify-center" style={{ marginTop: '4rem', textAlign: 'center' }}>
    <h1 className="text-2xl mb-4">Developer-First URL Shortener</h1>
    <p className="text-secondary mb-6" style={{ maxWidth: '32rem' }}>
      A highly functional, fast, and secure link management platform with built-in analytics and QR code generation.
    </p>
    <div className="flex gap-4">
      <Link to="/register" className="btn btn-primary">Create an account</Link>
      <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-secondary">View Documentation</a>
    </div>
  </div>
);

const Dashboard = () => (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2>Your Links</h2>
      <button className="btn btn-primary">Create Link</button>
    </div>
    <div className="card table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Original URL</th>
            <th>Short Link</th>
            <th>Clicks</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="5" className="text-center text-tertiary" style={{ padding: '3rem' }}>
              You haven't created any links yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// We need an inner app component because useAuth and useNavigate must be used inside a Router context.
const AppContent = () => (
  <AuthProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Layout>
  </AuthProvider>
);

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
