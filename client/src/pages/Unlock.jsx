import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const Unlock = () => {
  const { shortCode } = useParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data } = await api.post(`/unlock/${encodeURIComponent(shortCode)}`, { password });
      window.location.assign(data.data.originalUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not unlock this link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6" style={{ maxWidth: '28rem', margin: '3rem auto', width: '100%' }}>
      <h2 className="text-2xl mb-2">Password required</h2>
      <p className="text-secondary mb-6">Enter the password for this link to continue.</p>

      {error && (
        <div className="mb-4 p-4 text-sm text-danger bg-danger-subtle rounded border border-danger-subtle" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group mb-6">
          <label className="form-label" htmlFor="password">Link password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Checking...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default Unlock;
