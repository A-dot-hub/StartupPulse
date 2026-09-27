import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Activity, Menu, X, ArrowUpRight, RefreshCw, Sun, Moon } from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { backendHealth, checkConnection } = usePrediction();
  const { isLightMode, toggleTheme } = useTheme();
  const [isPinging, setIsPinging] = useState(false);

  const handlePing = async (e) => {
    e.preventDefault();
    setIsPinging(true);
    await checkConnection();
    setTimeout(() => setIsPinging(false), 500);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Analyze', path: '/analyze' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Simulator', path: '/simulator' },
    { label: 'History', path: '/history' },
  ];

  return (
    <header className="sp-navbar">
      <div className="navbar-inner">
        {/* Zone 1: Single text element wordmark with icon */}
        <Link to="/" className="brand-zone" onClick={() => setMobileMenuOpen(false)}>
          <div className="brand-icon-wrapper">
            <Activity size={18} strokeWidth={2.5} />
          </div>
          <span className="brand-text">
            Startup<span>Pulse</span>
          </span>
        </Link>

        {/* Zone 2: 4-6 Clean navigation links */}
        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="nav-actions">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Backend Health Check Pill */}
          <button
            type="button"
            className="backend-indicator"
            onClick={handlePing}
            title={`Backend: ${backendHealth.status}. Click to test FastAPI connection.`}
          >
            <span
              className={`status-dot ${
                backendHealth.status === 'healthy'
                  ? 'healthy'
                  : backendHealth.status === 'checking'
                  ? 'checking'
                  : 'unreachable'
              }`}
            />
            <span>
              {backendHealth.status === 'healthy'
                ? 'API Online'
                : backendHealth.status === 'checking'
                ? 'Checking...'
                : 'API Offline'}
            </span>
            <RefreshCw
              size={10}
              style={{
                marginLeft: '2px',
                animation: isPinging ? 'spin 0.6s linear infinite' : 'none',
              }}
            />
          </button>

          <Link to="/analyze" className="btn-primary">
            <span>Analyze Startup</span>
            <ArrowUpRight size={14} />
          </Link>

          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu open">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>{item.label}</span>
              <ArrowUpRight size={14} opacity={0.6} />
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '0.65rem' }}
              onClick={toggleTheme}
            >
              {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
              <span>{isLightMode ? 'Dark Theme' : 'Light Theme'}</span>
            </button>
            <Link
              to="/analyze"
              className="btn-primary"
              style={{ flex: 2 }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analyze Startup
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
