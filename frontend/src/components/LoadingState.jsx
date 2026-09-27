import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({
  message = 'Loading analytics data...',
  description = 'Connecting to StartupPulse backend services',
  minHeight = '300px',
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        minHeight,
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      <Loader2
        size={36}
        color="#38BDF8"
        style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}
      />
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.25rem' }}>
        {message}
      </h3>
      {description && (
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', maxWidth: '400px' }}>
          {description}
        </p>
      )}
    </div>
  );
}
