import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: '#080C14',
        padding: '3rem 1.75rem 2rem',
        marginTop: 'auto',
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
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
              Startup<span style={{ color: '#38BDF8' }}>Pulse</span>
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.6', maxWidth: '320px' }}>
            Machine learning platform analyzing early-stage venture characteristics, funding efficiency, and statistical risk probability.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Platform Modules
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#94A3B8' }}>
            <li>
              <Link to="/analyze" style={{ color: 'inherit' }} className="hover:text-white">
                Startup Predictor
              </Link>
            </li>
            <li>
              <Link to="/dashboard" style={{ color: 'inherit' }} className="hover:text-white">
                Model Evaluation & Metrics
              </Link>
            </li>
            <li>
              <Link to="/simulator" style={{ color: 'inherit' }} className="hover:text-white">
                What-If Scenario Simulator
              </Link>
            </li>
            <li>
              <Link to="/history" style={{ color: 'inherit' }} className="hover:text-white">
                Historical Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* Tech Stack specs */}
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Architecture
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={14} color="#38BDF8" />
              <span>Model: XGBoost Classifier</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} color="#10B981" />
              <span>Backend: FastAPI (Python 3.11)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} color="#F59E0B" />
              <span>Storage: MongoDB Predictions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} color="#A855F7" />
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
          color: '#64748B',
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
          <span>Zero Mock Data</span>
        </div>
      </div>
    </footer>
  );
}
