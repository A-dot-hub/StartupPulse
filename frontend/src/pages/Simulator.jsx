import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Sliders,
  Play,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { usePrediction } from '../context/PredictionContext';
import { predictStartup } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import {
  formatCurrency,
  formatPercentage,
} from '../utils/formatters';

export default function Simulator() {
  const { latestPrediction, defaultStartup } = usePrediction();

  // Baseline scenario parameters
  const baselineInput = latestPrediction?.input || defaultStartup;

  const [currentResult, setCurrentResult] = useState(() => {
    if (latestPrediction) {
      return {
        prediction: latestPrediction.prediction,
        success_probability: latestPrediction.success_probability,
        failure_probability: latestPrediction.failure_probability,
        risk_level: latestPrediction.risk_level,
      };
    }
    return {
      prediction: 'Successful Outcome',
      success_probability: 76.5,
      failure_probability: 23.5,
      risk_level: 'Low',
    };
  });

  // Simulator controls state (starting with baseline inputs)
  const [simInputs, setSimInputs] = useState({
    funding_total_usd: baselineInput.funding_total_usd,
    funding_rounds: baselineInput.funding_rounds,
    startup_age: baselineInput.startup_age,
    years_to_first_funding: baselineInput.years_to_first_funding,
    funding_per_round: baselineInput.funding_per_round,
  });

  const [modifiedResult, setModifiedResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState(null);

  // Initialize or synchronize baseline prediction if needed
  useEffect(() => {
    if (!latestPrediction) {
      // Run initial baseline prediction to ensure actual model values
      const initBaseline = async () => {
        try {
          const res = await predictStartup(baselineInput);
          if (res && res.data) {
            setCurrentResult(res.data);
          }
        } catch (err) {
          console.warn('Initial baseline prediction note:', err.message);
        }
      };
      initBaseline();
    }
  }, []);

  const handleInputChange = (field, val) => {
    const num = Number(val);
    setSimInputs((prev) => {
      const updated = { ...prev, [field]: num };

      // If user modifies funding_total or funding_rounds, optionally auto-adjust funding_per_round
      if (field === 'funding_total_usd' || field === 'funding_rounds') {
        const total = field === 'funding_total_usd' ? num : prev.funding_total_usd;
        const rounds = Math.max(1, field === 'funding_rounds' ? num : prev.funding_rounds);
        updated.funding_per_round = Math.round((total / rounds) * 100) / 100;
      }

      return updated;
    });
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimError(null);

    const total = Number(simInputs.funding_total_usd) || 0;
    const rounds = Math.max(1, parseInt(simInputs.funding_rounds, 10) || 1);
    const canonicalPerRound = Math.round((total / rounds) * 100) / 100;

    const payload = {
      ...baselineInput,
      funding_total_usd: total,
      funding_rounds: rounds,
      startup_age: Math.max(0, Number(simInputs.startup_age) || 0),
      years_to_first_funding: Math.max(0, Number(simInputs.years_to_first_funding) || 0),
      funding_per_round: canonicalPerRound,
    };

    try {
      const response = await predictStartup(payload);
      if (response && response.data) {
        setModifiedResult(response.data);
      } else {
        throw new Error('Simulation failed. Invalid response from model.');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setSimError(
        err.message ||
          'Unable to execute simulation. Make sure the FastAPI backend is running.'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const resetToBaseline = () => {
    setSimInputs({
      funding_total_usd: baselineInput.funding_total_usd,
      funding_rounds: baselineInput.funding_rounds,
      startup_age: baselineInput.startup_age,
      years_to_first_funding: baselineInput.years_to_first_funding,
      funding_per_round: baselineInput.funding_per_round,
    });
    setModifiedResult(null);
    setSimError(null);
  };

  // Delta calculations
  const currentSuccess = Number(currentResult?.success_probability) || 0;
  const newSuccess = modifiedResult
    ? Number(modifiedResult.success_probability)
    : currentSuccess;
  const delta = newSuccess - currentSuccess;

  // Comparison chart data
  const comparisonData = [
    {
      scenario: 'Current Scenario',
      'Success Probability': currentSuccess,
      'Failure Probability': Number(currentResult?.failure_probability) || 0,
    },
    {
      scenario: 'Modified Scenario',
      'Success Probability': newSuccess,
      'Failure Probability': modifiedResult
        ? Number(modifiedResult.failure_probability)
        : Number(currentResult?.failure_probability) || 0,
    },
  ];

  return (
    <div className="content-wrapper">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What-If Counterfactual Inference
            </span>
          </div>
          <h1 className="page-title">Startup Scenario Simulator</h1>
          <p className="page-subtitle">
            Modify startup capital structure and milestone timings to see how the real machine learning prediction responds.
          </p>
        </div>

        {simError && (
          <div className="error-banner">
            <AlertCircle size={20} color="#FB7185" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Simulation Execution Error</strong>
              <p style={{ fontSize: '0.85rem' }}>{simError}</p>
            </div>
          </div>
        )}

        {/* Delta Overview Strip */}
        <div
          className="sp-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            padding: '1.5rem 2rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current Success Probability
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-mono)' }}>
                {formatPercentage(currentSuccess)}
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <RiskBadge risk={currentResult?.risk_level} />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Simulated Success Probability
              </span>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: modifiedResult ? (delta >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)') : 'var(--text-dim)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {formatPercentage(newSuccess)}
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <RiskBadge risk={modifiedResult?.risk_level || currentResult?.risk_level} />
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Net Probability Impact
              </span>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontFamily: 'var(--font-mono)',
                  color: !modifiedResult
                    ? 'var(--text-dim)'
                    : delta > 0
                    ? 'var(--color-success-text)'
                    : delta < 0
                    ? 'var(--color-danger-text)'
                    : 'var(--text-heading)',
                }}
              >
                {!modifiedResult ? (
                  <Minus size={22} />
                ) : delta > 0 ? (
                  <TrendingUp size={24} />
                ) : delta < 0 ? (
                  <TrendingDown size={24} />
                ) : (
                  <Minus size={22} />
                )}
                <span>
                  {!modifiedResult
                    ? '0.00%'
                    : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}%`}
                </span>
              </div>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {!modifiedResult
                  ? 'Adjust sliders and run simulation'
                  : delta > 0
                  ? 'Favorable scenario adjustment'
                  : delta < 0
                  ? 'Higher structural risk detected'
                  : 'Neutral risk variance'}
              </span>
            </div>
          </div>
        </div>

        {/* Simulator Grid: Interactive Controls & Live Comparison Chart */}
        <div className="grid-2">
          {/* Controls Panel */}
          <div className="sp-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  Scenario Parameter Controls
                </h3>
                <span style={{ fontSize: '0.785rem', color: 'var(--text-dim)' }}>
                  Adjust variables to run against POST /predict
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={resetToBaseline}
                style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
                title="Reset to original baseline"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Control 1: Funding Total */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="sim-funding">
                    Funding Total (USD)
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {formatCurrency(simInputs.funding_total_usd)}
                  </span>
                </div>
                <input
                  id="sim-funding"
                  type="range"
                  min="100000"
                  max="50000000"
                  step="250000"
                  value={simInputs.funding_total_usd}
                  onChange={(e) => handleInputChange('funding_total_usd', e.target.value)}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                  <span>$100k</span>
                  <span>$25M</span>
                  <span>$50M+</span>
                </div>
              </div>

              {/* Control 2: Funding Rounds */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="sim-rounds">
                    Funding Rounds
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {simInputs.funding_rounds} rounds
                  </span>
                </div>
                <input
                  id="sim-rounds"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={simInputs.funding_rounds}
                  onChange={(e) => handleInputChange('funding_rounds', e.target.value)}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                  <span>1 round</span>
                  <span>5 rounds</span>
                  <span>10 rounds</span>
                </div>
              </div>

              {/* Control 3: Startup Age */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="sim-age">
                    Startup Age (Years)
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {simInputs.startup_age} yrs
                  </span>
                </div>
                <input
                  id="sim-age"
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={simInputs.startup_age}
                  onChange={(e) => handleInputChange('startup_age', e.target.value)}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                  <span>0 yr (Newly founded)</span>
                  <span>7 yrs</span>
                  <span>15 yrs</span>
                </div>
              </div>

              {/* Control 4: Years to First Funding */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="sim-ttff">
                    Years to First Funding
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {simInputs.years_to_first_funding} yrs
                  </span>
                </div>
                <input
                  id="sim-ttff"
                  type="range"
                  min="0"
                  max="8"
                  step="0.2"
                  value={simInputs.years_to_first_funding}
                  onChange={(e) => handleInputChange('years_to_first_funding', e.target.value)}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B' }}>
                  <span>0 (Immediate)</span>
                  <span>4 yrs</span>
                  <span>8 yrs</span>
                </div>
              </div>

              {/* Control 5: Funding Per Round */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="sim-per-round">
                    Funding Per Round (USD)
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {formatCurrency(simInputs.funding_per_round)}
                  </span>
                </div>
                <input
                  id="sim-per-round"
                  type="number"
                  min="0"
                  step="25000"
                  className="form-input tabular-nums"
                  value={simInputs.funding_per_round}
                  onChange={(e) => handleInputChange('funding_per_round', e.target.value)}
                />
              </div>

              <div style={{ paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={runSimulation}
                  disabled={isSimulating}
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  {isSimulating ? (
                    <>
                      <span className="spinner" />
                      <span>Executing Real ML Inference...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" />
                      <span>Execute Scenario Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Visualization & Comparison Panel */}
          <div className="sp-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                Scenario Outcome Comparison
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Visualizing Current Baseline vs Modified Parameters
              </p>
            </div>

            <div style={{ flex: 1, minHeight: '320px' }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData} margin={{ top: 20, right: 20, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="scenario" stroke="var(--text-dim)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} domain={[0, 100]} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-elevated)',
                    }}
                    formatter={(val) => [`${val}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                  <Bar dataKey="Success Probability" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Failure Probability" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison summary table */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ padding: '0.75rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.75rem' }}>Current Prediction</span>
                <strong style={{ color: 'var(--text-heading)', display: 'block', margin: '0.2rem 0' }}>
                  {currentResult?.prediction || 'Successful Outcome'}
                </strong>
                <RiskBadge risk={currentResult?.risk_level} />
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--accent-cyan)' }}>
                <span style={{ color: 'var(--accent-cyan)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Simulated Prediction</span>
                <strong style={{ color: 'var(--text-heading)', display: 'block', margin: '0.2rem 0' }}>
                  {modifiedResult?.prediction || currentResult?.prediction || 'Pending Run'}
                </strong>
                <RiskBadge risk={modifiedResult?.risk_level || currentResult?.risk_level} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
