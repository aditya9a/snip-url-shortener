import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const ProgressBar = ({ label, count, max }) => {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-secondary">{count}</span>
      </div>
      <div style={{ width: '100%', backgroundColor: 'var(--border-subtle)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, backgroundColor: 'var(--primary-solid)', height: '100%' }} />
      </div>
    </div>
  );
};

const Analytics = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, qrRes] = await Promise.all([
          api.get(`/links/${id}/analytics`),
          api.get(`/links/${id}/qr`)
        ]);
        
        if (statsRes.data.success) {
          setData(statsRes.data.data);
        }
        if (qrRes.data.success) {
          setQrCode(qrRes.data.data.qrCode);
        }
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-secondary">Loading analytics...</div>;
  if (error) return <div className="p-6 text-center text-danger">{error}</div>;
  if (!data) return null;

  const { link, analytics } = data;
  
  // Find max values for progress bars
  const maxCountry = Math.max(...analytics.geographic.map(g => g.clicks), 0);
  const maxDevice = Math.max(...analytics.devices.map(d => d.clicks), 0);
  const maxReferrer = Math.max(...analytics.referrers.map(r => r.clicks), 0);

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-secondary font-medium" style={{ textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl mb-1">{link.title || 'Untitled Link'}</h2>
          <p className="text-secondary mb-2" style={{ wordBreak: 'break-all' }}>{link.originalUrl}</p>
          <div className="flex items-center gap-4">
            <a href={`http://localhost:5000/${link.shortCode}`} target="_blank" rel="noreferrer" className="text-primary font-medium" style={{ textDecoration: 'none' }}>
              snip.io/{link.shortCode}
            </a>
            <span className="text-tertiary text-sm">Created {new Date(link.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        {qrCode && (
          <div className="card p-2 text-center">
            <img src={qrCode} alt="QR Code" style={{ width: '100px', height: '100px' }} />
            <a href={`http://localhost:5000/api/links/${link.id}/qr/download`} className="text-xs text-primary mt-1 block" download>
              Download
            </a>
          </div>
        )}
      </div>

      {/* Top Level Metric */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm text-secondary mb-2 uppercase tracking-wide">Total Clicks</h3>
        <div className="text-4xl font-bold">{link.totalClicks}</div>
      </div>

      {/* Breakdowns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Geographic */}
        <div className="card p-6">
          <h3 className="mb-4">Top Countries</h3>
          {analytics.geographic.length > 0 ? (
            analytics.geographic.map(geo => (
              <ProgressBar
                key={geo.country}
                label={geo.country === 'Unknown' ? 'Location unavailable' : geo.country}
                count={geo.clicks}
                max={maxCountry}
              />
            ))
          ) : (
            <p className="text-secondary text-sm">No geographic data yet.</p>
          )}
        </div>

        {/* Devices */}
        <div className="card p-6">
          <h3 className="mb-4">Devices</h3>
          {analytics.devices.length > 0 ? (
            analytics.devices.map(device => (
              <ProgressBar key={device.device} label={device.device} count={device.clicks} max={maxDevice} />
            ))
          ) : (
            <p className="text-secondary text-sm">No device data yet.</p>
          )}
        </div>

        {/* Referrers */}
        <div className="card p-6">
          <h3 className="mb-4">Top Referrers</h3>
          {analytics.referrers.length > 0 ? (
            analytics.referrers.map(ref => (
              <ProgressBar key={ref.referrer} label={ref.referrer} count={ref.clicks} max={maxReferrer} />
            ))
          ) : (
            <p className="text-secondary text-sm">No referrer data yet.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Analytics;
