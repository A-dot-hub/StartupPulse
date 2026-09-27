import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { normalizeRisk } from '../utils/formatters';

export default function RiskBadge({ risk = 'Medium', size = 'normal' }) {
  const level = normalizeRisk(risk);

  const config = {
    Low: {
      label: 'Low Risk',
      className: 'badge-low',
      icon: ShieldCheck,
    },
    Medium: {
      label: 'Medium Risk',
      className: 'badge-medium',
      icon: AlertTriangle,
    },
    High: {
      label: 'High Risk',
      className: 'badge-high',
      icon: AlertOctagon,
    },
  }[level] || {
    label: `${level} Risk`,
    className: 'badge-medium',
    icon: AlertTriangle,
  };

  const IconComponent = config.icon;
  const iconSize = size === 'large' ? 18 : 14;

  return (
    <span
      className={`badge-clean ${config.className}`}
      style={size === 'large' ? { padding: '0.4rem 0.85rem', fontSize: '0.875rem' } : {}}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <IconComponent size={iconSize} strokeWidth={2.2} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
