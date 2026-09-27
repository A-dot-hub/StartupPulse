import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sliders,
  History,
  RotateCcw,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  Layers,
  Clock,
  Database,
} from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';
import PredictionCard from '../components/PredictionCard';
import ProbabilityChart from '../components/ProbabilityChart';
import SHAPExplanation from '../components/SHAPExplanation';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { explainStartup } from '../services/api';

export default function Results() {
  const navigate = useNavigate();
  const { latestPrediction } = usePrediction();
  const [explanation, setExplanation] = React.useState(
    latestPrediction?.explanation || null
  );
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [explainError, setExplainError] = React.useState(null);

  React.useEffect(() => {
    if (latestPrediction?.explanation) {
      setExplanation(latestPrediction.explanation);
    } else if (latestPrediction?.input) {
      let isMounted = true;
      setIsExplaining(true);
      explainStartup(latestPrediction.input)
        .then((res) => {
          if (isMounted && res?.data) {
            setExplanation(res.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setExplainError(err.message);
          }
        })
        .finally(() => {
          if (isMounted) setIsExplaining(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [latestPrediction]);

  if (!latestPrediction) {
    return (
      <div className="content-wrapper">
        <EmptyState
          title="No Active Prediction Result"
          description="You haven't run a startup prediction yet, or your previous session has expired. Fill in startup details to generate an instant AI assessment."
          actionText="Analyze a Startup Now"
          actionHref="/analyze"
          icon={Building}
        />
      </div>
    );
  }

  const inputs = latestPrediction.input || {};

  return (
    <div className="content-wrapper">
      <div className="results-container">
        {/* Top bar breadcrumb / actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Inference Report
            </span>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              Startup Analysis Result
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/analyze" className="btn-secondary">
              <RotateCcw size={15} />
              <span>Analyze Another</span>
            </Link>

            <Link to="/simulator" className="btn-secondary">
              <Sliders size={15} />
              <span>Open in Simulator</span>
            </Link>

            <Link to="/history" className="btn-secondary">
              <History size={15} />
              <span>View History</span>
            </Link>
          </div>
        </div>

        {/* Hero Prediction Card */}
        <PredictionCard predictionData={latestPrediction} />

        {/* Visual Probability Chart & Model Meta */}
        <div className="grid-2">
          <div className="sp-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                Probability Distribution
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                Recharts Analytics
              </span>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ProbabilityChart
                successProbability={latestPrediction.success_probability}
                failureProbability={latestPrediction.failure_probability}
                size={240}
                innerRadius={65}
                outerRadius={95}
              />
            </div>
          </div>

          <div className="sp-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Execution Telemetry
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: latestPrediction.saved_to_database ? '#34D399' : '#F59E0B',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Database size={12} />
                  {latestPrediction.saved_to_database ? 'Saved to MongoDB' : 'Transient Session'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94A3B8' }}>Classifier Architecture</span>
                  <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>XGBoost 3.2</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94A3B8' }}>Input Features Evaluated</span>
                  <span style={{ color: '#F8FAFC', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>10 Features</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94A3B8' }}>Prediction ID</span>
                  <span style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {latestPrediction.prediction_id || 'local-session-id'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94A3B8' }}>Evaluated At</span>
                  <span style={{ color: '#94A3B8', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {new Date(latestPrediction.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <Link to="/simulator" className="btn-primary" style={{ width: '100%' }}>
                <Sliders size={16} />
                <span>Simulate Capital & Round Scenarios</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Individual SHAP Explainability Component */}
        <SHAPExplanation
          explanation={explanation}
          isLoading={isExplaining}
          error={explainError}
        />

        {/* Input Parameters Inspection Card */}
        <div className="inputs-card">
          <div className="inputs-header">
            <h3 className="inputs-title">Startup Attributes Used for Evaluation</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              POST /predict payload verification
            </span>
          </div>

          <div className="inputs-grid">
            <div className="input-item">
              <span className="input-item-label">Primary Sector</span>
              <span className="input-item-value">{inputs.primary_category || 'N/A'}</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Total Capital Raised</span>
              <span className="input-item-value">{formatCurrency(inputs.funding_total_usd)}</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Funding Rounds</span>
              <span className="input-item-value">{inputs.funding_rounds} rounds</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Average Per Round</span>
              <span className="input-item-value">{formatCurrency(inputs.funding_per_round)}</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Startup Age</span>
              <span className="input-item-value">{inputs.startup_age} years</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Years to 1st Funding</span>
              <span className="input-item-value">{inputs.years_to_first_funding} years</span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Geographic Hub</span>
              <span className="input-item-value">
                {inputs.city || 'Unknown'}, {inputs.state_code || 'N/A'} ({inputs.country_code || 'N/A'})
              </span>
            </div>

            <div className="input-item">
              <span className="input-item-label">Region</span>
              <span className="input-item-value">{inputs.region || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
