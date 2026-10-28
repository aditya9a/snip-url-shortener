import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import CreateLinkModal from '../components/CreateLinkModal';
import { getShortUrl } from '../utils/urls';

const Dashboard = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchLinks = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/links?page=${page}&limit=10`);
      if (data.success) {
        setLinks(data.data.links);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      setError('Failed to load links.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await api.delete(`/links/${id}`);
      fetchLinks(pagination.page); // Refresh list
    } catch (err) {
      alert('Failed to delete link.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl">Your Links</h2>
          <p className="text-secondary text-sm">Manage and track your shortened URLs.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          Create Link
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 text-sm text-danger bg-danger-subtle rounded border border-danger-subtle" style={{ borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      <div className="card table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Short Link</th>
              <th>Original URL</th>
              <th>Clicks</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center text-tertiary" style={{ padding: '3rem' }}>
                  Loading links...
                </td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-tertiary" style={{ padding: '3rem' }}>
                  You haven't created any links yet. Click "Create Link" to get started.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id}>
                  <td>
                    <div className="font-medium text-primary">
                      <a href={getShortUrl(link.shortCode)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--primary-solid)' }}>
                        {getShortUrl(link.shortCode)}
                      </a>
                    </div>
                    {link.title && <div className="text-xs text-secondary mt-1">{link.title}</div>}
                  </td>
                  <td>
                    <div style={{ maxWidth: '20rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={link.originalUrl}>
                      {link.originalUrl}
                    </div>
                  </td>
                  <td className="font-medium">{link.totalClicks}</td>
                  <td className="text-sm text-secondary">
                    {new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link to={`/dashboard/${link.id}/analytics`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Stats
                      </Link>
                      <button onClick={() => handleDelete(link.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Basic Pagination Controls */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-secondary">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total links)
          </p>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary" 
              disabled={pagination.page === 1}
              onClick={() => fetchLinks(pagination.page - 1)}
            >
              Previous
            </button>
            <button 
              className="btn btn-secondary" 
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchLinks(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <CreateLinkModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchLinks(1)} 
      />
    </div>
  );
};

export default Dashboard;
