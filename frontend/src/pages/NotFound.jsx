import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="content-wrapper">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38BDF8',
            marginBottom: '1.5rem',
          }}
        >
          <Compass size={32} />
        </div>

        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#38BDF8',
            marginBottom: '0.5rem',
          }}
        >
          404 Error
        </span>

        <h1 className="page-title" style={{ marginBottom: '0.75rem' }}>
          Page Not Found
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#94A3B8',
            maxWidth: '460px',
            lineHeight: '1.6',
            marginBottom: '2rem',
          }}
        >
          The page or report you requested does not exist or may have been relocated.
        </p>

        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
