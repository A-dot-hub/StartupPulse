import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--footer-bg)',
        padding: '3rem 1.75rem 2rem',
        marginTop: 'auto',
        transition: 'background 0.2s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Brand & Mission */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div className="brand-icon-wrapper" style={{ width: '26px', height: '26px' }}>
              <Activity size={15} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-heading)' }}>
              Startup<span style={{ color: 'var(--accent-cyan)' }}>Pulse</span>
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '320px' }}>
            Machine learning platform analyzing early-stage venture characteristics, funding efficiency, and statistical risk probability.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Platform Modules
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <li>
              <Link to="/analyze" style={{ color: 'inherit' }}>
                Startup Predictor
              </Link>
            </li>
            <li>
              <Link to="/dashboard" style={{ color: 'inherit' }}>
                Model Evaluation & Metrics
              </Link>
            </li>
            <li>
              <Link to="/simulator" style={{ color: 'inherit' }}>
                What-If Scenario Simulator
              </Link>
            </li>
            <li>
              <Link to="/history" style={{ color: 'inherit' }}>
                Historical Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* Tech Stack specs */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Architecture
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={14} color="var(--accent-cyan)" />
              <span>Model: XGBoost Classifier</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} color="var(--color-success)" />
              <span>Backend: FastAPI (Python 3.11)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} color="var(--color-warning)" />
              <span>Storage: MongoDB Predictions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="var(--accent-indigo)" />
              <span>Features: 10 Dimensions</span>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1360px',
          margin: '1.5rem auto 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.785rem',
          color: 'var(--text-dim)',
        }}
      >
        <span>
          © {new Date().getFullYear()} StartupPulse. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Probabilistic ML Forecast</span>
          <span>·</span>
          <span>FastAPI 8000</span>
          <span>·</span>
          <span>SHAP Explainability</span>
        </div>
      </div>
    </footer>
  );
}
