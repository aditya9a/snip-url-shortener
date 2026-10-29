import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const messages = {
  not_found: 'This short link does not exist.',
  disabled: 'This link has been disabled by its owner.',
  expired: 'This short link has expired.',
  server_error: 'We could not open this link right now. Please try again later.',
};

const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const message = messages[type] || 'We could not open this link.';

  return (
    <div className="card p-6 text-center" style={{ maxWidth: '34rem', margin: '3rem auto', width: '100%' }}>
      <h1 className="text-2xl mb-4">Link unavailable</h1>
      <p className="text-secondary mb-6" role="alert">{message}</p>
      <Link to="/" className="btn btn-primary">Go to Snip</Link>
    </div>
  );
};

export default ErrorPage;
