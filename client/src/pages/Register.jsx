import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      // Handle Zod array errors or generic message
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.message).join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to register');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6" style={{ maxWidth: '24rem', margin: '4rem auto' }}>
      <h2 className="mb-2 text-center">Create an account</h2>
      <p className="text-secondary text-sm mb-6 text-center">Start managing your links securely.</p>
      
      {error && (
        <div className="mb-4 p-4 text-sm text-danger bg-danger-subtle rounded border border-danger-subtle" style={{ borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="name">Full name</label>
          <input 
            id="name"
            type="text" 
            className="input" 
            placeholder="Jane Doe"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            autoFocus
          />
        </div>
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
          />
        </div>
        <div className="form-group mb-6">
          <label className="form-label" htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            className="input" 
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength="8"
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      
      <p className="text-center text-sm text-secondary mt-6">
        Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--primary-solid)', textDecoration: 'none' }}>Sign in</Link>
      </p>
    </div>
  );
};

export default Register;
