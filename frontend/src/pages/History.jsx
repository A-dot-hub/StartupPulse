import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  RotateCw,
  AlertCircle,
  Eye,
  X,
  Database,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { getPredictionHistory, getPrediction } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import SHAPExplanation from '../components/SHAPExplanation';
import {
  formatDate,
  formatPercentage,
  formatCurrency,
} from '../utils/formatters';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected item modal state
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPredictionHistory(50);
      if (response && response.data) {
        setHistoryList(response.data);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error('History fetch error:', err);
      setError(
        err.message ||
          'Unable to connect to StartupPulse API. Make sure the FastAPI backend and MongoDB are running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRowClick = async (predictionSummary) => {
    setIsFetchingDetail(true);
    setDetailError(null);
    setSelectedPrediction(null);

    try {
      const response = await getPrediction(predictionSummary.id);
      if (response && response.data) {
        setSelectedPrediction(response.data);
      } else {
        // Fallback to summary row data if detail endpoint doesn't return full object
        setSelectedPrediction(predictionSummary);
      }
    } catch (err) {
      console.error('Prediction detail error:', err);
      // Fallback to row summary if single fetch fails
      setSelectedPrediction(predictionSummary);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="history-container">
        {/* Topbar */}
        <div className="history-topbar">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                MongoDB Document Store
              </span>
            </div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              Prediction History
            </h1>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchHistory}
            disabled={isLoading}
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh Archive</span>
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={22} color="#FB7185" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Database Connection Notice</strong>
              <p style={{ fontSize: '0.875rem', marginTop: '0.2rem' }}>{error}</p>
              <p style={{ fontSize: '0.775rem', color: '#CBD5E1', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                Ensure MongoDB daemon is running locally: <code>mongod --dbpath ...</code>
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <LoadingState
            message="Querying MongoDB predictions collection..."
            description="Fetching historical records from GET /history"
          />
        ) : historyList.length === 0 ? (
          <EmptyState
            title="No Prediction History Found"
            description="No venture evaluations have been stored yet. Submit your first analysis to record persistent historical data."
            actionText="Run Startup Analysis"
            actionHref="/analyze"
            icon={Database}
          />
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Primary Sector</th>
                  <th>Prediction</th>
                  <th>Success Prob.</th>
                  <th>Failure Prob.</th>
                  <th>Risk Level</th>
                  <th>Model</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item) => {
                  const isSuccess =
                    item.prediction === 'Successful Outcome' ||
                    item.prediction_class === 1;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {formatDate(item.created_at)}
                      </td>
                      <td style={{ fontWeight: 600, color: '#F8FAFC' }}>
                        {item.input?.primary_category || 'Software'}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isSuccess ? '#34D399' : '#FB7185',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          {item.prediction || (isSuccess ? 'Successful Outcome' : 'Failure')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#34D399', fontWeight: 600 }}>
                        {formatPercentage(item.success_probability)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#FB7185', fontWeight: 600 }}>
                        {formatPercentage(item.failure_probability)}
                      </td>
                      <td>
                        <RiskBadge risk={item.risk_level} />
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                          {item.model || 'XGBoost'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(item);
                          }}
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Prediction Detail Modal */}
        {(selectedPrediction || isFetchingDetail) && (
          <div
            className="history-modal-backdrop"
            onClick={() => setSelectedPrediction(null)}
          >
            <div
              className="history-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="history-modal-close"
                onClick={() => setSelectedPrediction(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {isFetchingDetail ? (
                <LoadingState message="Loading prediction details..." />
              ) : selectedPrediction ? (
                <div>
                  <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                        Record ID: {selectedPrediction.id}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                      {selectedPrediction.input?.primary_category || 'Startup'} Assessment Detail
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Timestamp: {formatDate(selectedPrediction.created_at)}
                    </span>
                  </div>

                  {/* Outcome Highlight */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>
                        Prediction Outcome
                      </span>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color:
                            selectedPrediction.prediction === 'Successful Outcome' ||
                            selectedPrediction.prediction_class === 1
                              ? '#34D399'
                              : '#FB7185',
                        }}
                      >
                        {selectedPrediction.prediction}
                      </div>
                    </div>
                    <RiskBadge risk={selectedPrediction.risk_level} size="large" />
                  </div>

                  {/* Probability metrics */}
                  <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card">
                      <span className="stat-card-label">Success Probability</span>
                      <div className="stat-card-value" style={{ color: '#34D399' }}>
                        {formatPercentage(selectedPrediction.success_probability)}
                      </div>
                    </div>
                    <div className="stat-card">
                      <span className="stat-card-label">Failure Probability</span>
                      <div className="stat-card-value" style={{ color: '#FB7185' }}>
                        {formatPercentage(selectedPrediction.failure_probability)}
                      </div>
                    </div>
                  </div>

                  {/* Input parameters breakdown */}
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                    Startup Characteristics Supplied
                  </h4>

                  <div
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.75rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Category</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
                        {selectedPrediction.input?.primary_category || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Funding Total</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(selectedPrediction.input?.funding_total_usd)}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Funding Rounds</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {selectedPrediction.input?.funding_rounds} rounds
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Per Round</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(selectedPrediction.input?.funding_per_round)}
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Startup Age</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {selectedPrediction.input?.startup_age} years
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Years to 1st Funding</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {selectedPrediction.input?.years_to_first_funding} years
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Location</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
                        {selectedPrediction.input?.city || 'Unknown'}, {selectedPrediction.input?.state_code || ''} ({selectedPrediction.input?.country_code || 'USA'})
                      </span>
                    </div>

                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Region</span>
                      <span style={{ color: '#F8FAFC', fontWeight: 600 }}>
                        {selectedPrediction.input?.region || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* SHAP Explanation in History Modal if available */}
                  {selectedPrediction.explanation && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <SHAPExplanation explanation={selectedPrediction.explanation} />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
