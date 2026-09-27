import React from 'react';

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  className = '',
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <span className="stat-card-icon">
            <Icon size={18} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        {subtext && <div className="stat-card-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
