import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';

// Layout Component (Navbar + Content area)
const Layout = ({ children }) => (
  <div className="flex flex-col" style={{ minHeight: '100vh' }}>
    <header style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="container flex items-center justify-between" style={{ height: '4rem' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.25rem' }}>
          Snip
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>Log in</Link>
          <Link to="/register" className="btn btn-primary">Sign up</Link>
        </nav>
      </div>
    </header>
    <main className="container flex-col" style={{ flex: 1, padding: '2rem 1.5rem' }}>
      {children}
    </main>
  </div>
);

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

const Login = () => (
  <div className="card p-6" style={{ maxWidth: '24rem', margin: '4rem auto' }}>
    <h2 className="mb-6">Log in to Snip</h2>
    <div className="form-group">
      <label className="form-label">Email</label>
      <input type="email" className="input" placeholder="you@example.com" />
    </div>
    <div className="form-group mb-6">
      <label className="form-label">Password</label>
      <input type="password" className="input" />
    </div>
    <button className="btn btn-primary w-full">Sign In</button>
  </div>
);

const Register = () => (
  <div className="card p-6" style={{ maxWidth: '24rem', margin: '4rem auto' }}>
    <h2 className="mb-6">Create an account</h2>
    <p className="text-secondary text-sm mb-4">Get started with a free account to manage your links.</p>
    <div className="form-group">
      <label className="form-label">Name</label>
      <input type="text" className="input" placeholder="Jane Doe" />
    </div>
    <div className="form-group">
      <label className="form-label">Email</label>
      <input type="email" className="input" placeholder="you@example.com" />
    </div>
    <div className="form-group mb-6">
      <label className="form-label">Password</label>
      <input type="password" className="input" />
    </div>
    <button className="btn btn-primary w-full">Sign Up</button>
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

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
