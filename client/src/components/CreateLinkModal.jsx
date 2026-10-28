import React, { useState } from 'react';
import api from '../api/axios';

const CreateLinkModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ originalUrl: '', customAlias: '', title: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Clean up empty optional fields
      const payload = { originalUrl: formData.originalUrl };
      if (formData.customAlias.trim()) payload.customAlias = formData.customAlias.trim();
      if (formData.title.trim()) payload.title = formData.title.trim();
      if (formData.password) payload.password = formData.password;

      await api.post('/links', payload);
      
      // Reset form
      setFormData({ originalUrl: '', customAlias: '', title: '', password: '' });
      onSuccess(); // Refresh the list
      onClose(); // Close modal
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map(e => e.message).join(', '));
      } else {
        setError(err.response?.data?.message || 'Failed to create link');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card p-6" style={{ width: '100%', maxWidth: '32rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h3>Create a New Link</h3>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>✕</button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-danger bg-danger-subtle rounded border border-danger-subtle" style={{ borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label" htmlFor="originalUrl">Destination URL *</label>
            <input 
              id="originalUrl"
              type="url" 
              className="input" 
              placeholder="https://example.com/very-long-url"
              value={formData.originalUrl}
              onChange={(e) => setFormData({...formData, originalUrl: e.target.value})}
              required
              autoFocus
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label" htmlFor="title">Title (Optional)</label>
            <input 
              id="title"
              type="text" 
              className="input" 
              placeholder="e.g. Fall Marketing Campaign"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="form-group mb-6">
            <label className="form-label" htmlFor="customAlias">Custom Alias (Optional)</label>
            <div className="flex items-center">
              <span className="text-secondary mr-2">snip.io/</span>
              <input 
                id="customAlias"
                type="text" 
                className="input" 
                placeholder="my-campaign"
                value={formData.customAlias}
                onChange={(e) => setFormData({...formData, customAlias: e.target.value})}
                pattern="^[a-zA-Z0-9-_]+$"
                title="Only letters, numbers, hyphens, and underscores are allowed"
              />
            </div>
            <span className="text-tertiary text-sm mt-1">Leave blank for a random short code.</span>
          </div>

          <div className="form-group mb-6">
            <label className="form-label" htmlFor="linkPassword">Password (Optional)</label>
            <input
              id="linkPassword"
              type="password"
              className="input"
              placeholder="At least 4 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              minLength={4}
              maxLength={72}
              autoComplete="new-password"
            />
            <span className="text-tertiary text-sm mt-1">Visitors will need this password before they can open the destination.</span>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Shorten URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLinkModal;
