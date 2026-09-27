import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Sliders,
  History,
  FileText,
  Activity,
} from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';

export default function Sidebar({ className = '' }) {
  const { latestPrediction, backendHealth } = usePrediction();

  const links = [
    { label: 'Overview', path: '/', icon: Activity },
    { label: 'Analyze Startup', path: '/analyze', icon: Sparkles },
    ...(latestPrediction
      ? [{ label: 'Latest Results', path: '/results', icon: FileText }]
      : []),
    { label: 'Model Benchmarks', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Scenario Simulator', path: '/simulator', icon: Sliders },
    { label: 'Prediction History', path: '/history', icon: History },
  ];

  return (
    <aside
      className={`sp-sidebar ${className}`}
      style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'background 0.2s ease',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)',
            padding: '0 0.75rem',
            marginBottom: '0.75rem',
          }}
        >
          Navigation
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Backend connection summary */}
      <div
        style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.85rem',
          fontSize: '0.785rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
          <span
            className={`status-dot ${
              backendHealth.status === 'healthy' ? 'healthy' : 'unreachable'
            }`}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>
            FastAPI Server
          </span>
        </div>
        <div style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          http://127.0.0.1:8000
        </div>
      </div>
    </aside>
  );
}
