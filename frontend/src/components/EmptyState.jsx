import React from 'react';
import { Link } from 'react-router-dom';
import { Database } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There is currently no data recorded for this view.',
  actionText,
  actionHref,
  onAction,
  icon: Icon = Database,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.015)',
        border: '1px dashed rgba(255, 255, 255, 0.12)',
        borderRadius: '14px',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38BDF8',
          marginBottom: '1.25rem',
        }}
      >
        <Icon size={26} strokeWidth={2} />
      </div>

      <h3
        style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#F8FAFC',
          marginBottom: '0.4rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9rem',
          color: '#94A3B8',
          maxWidth: '460px',
          lineHeight: '1.6',
          marginBottom: actionText ? '1.5rem' : 0,
        }}
      >
        {description}
      </p>

      {actionText && actionHref && (
        <Link to={actionHref} className="btn-primary">
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button type="button" onClick={onAction} className="btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}
