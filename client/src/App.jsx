import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Placeholder Pages (We will build these out in the next steps)
const Home = () => (
  <div className="animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
    <h1 className="text-gradient" style={{ fontSize: '4rem', marginBottom: '1rem' }}>Snip.</h1>
    <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '2rem' }}>
      Premium URL shortening with advanced analytics.
    </p>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <button className="btn-primary">Get Started</button>
      <button className="btn-secondary">Log In</button>
    </div>
  </div>
);

const Dashboard = () => <div className="animate-fade-in glass-panel" style={{ margin: '2rem', padding: '2rem' }}><h2>Dashboard (Protected)</h2></div>;
const Login = () => <div className="animate-fade-in glass-panel" style={{ margin: '2rem', padding: '2rem' }}><h2>Log In</h2></div>;
const Register = () => <div className="animate-fade-in glass-panel" style={{ margin: '2rem', padding: '2rem' }}><h2>Register</h2></div>;
const NotFound = () => <div className="animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}><h2 className="text-gradient">404 - Not Found</h2></div>;

function App() {
  return (
    <BrowserRouter>
      {/* 
        This is our main application router. 
        Later, we'll wrap this in an AuthProvider to protect routes.
      */}
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes (We'll add auth guards later) */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
