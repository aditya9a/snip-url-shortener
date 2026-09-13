import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6" style={{ maxWidth: '24rem', margin: '4rem auto' }}>
      <h2 className="mb-6 text-center">Log in to Snip</h2>
      
      {error && (
        <div className="mb-4 p-4 text-sm text-danger bg-danger-subtle rounded border border-danger-subtle" style={{ borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <input 
            id="email"
            type="email" 
            className="input" 
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            autoFocus
          />
        </div>
        <div className="form-group mb-6">
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            className="input" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      
      <p className="text-center text-sm text-secondary mt-6">
        Don't have an account? <Link to="/register" className="font-medium" style={{ color: 'var(--primary-solid)', textDecoration: 'none' }}>Sign up</Link>
      </p>
    </div>
  );
};

export default Login;
