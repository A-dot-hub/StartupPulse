import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { formatPercentage } from '../utils/formatters';

export default function PredictionCard({ predictionData }) {
  if (!predictionData) return null;

  const isSuccess =
    predictionData.prediction === 'Successful Outcome' ||
    predictionData.prediction_class === 1;

  const successProb = Number(predictionData.success_probability) || 0;
  const failureProb = Number(predictionData.failure_probability) || 0;
  const riskLevel = predictionData.risk_level || 'Medium';

  return (
    <div
      className={`results-hero-card ${
        isSuccess ? 'success-border' : 'failure-border'
      }`}
    >
      <div className="results-grid-main">
        <div>
          <div className="prediction-outcome-tag">
            {isSuccess ? (
              <>
                <CheckCircle2 size={16} color="var(--color-success)" aria-hidden="true" />
                <span style={{ color: 'var(--color-success-text)' }}>AI Prediction Model Result</span>
              </>
            ) : (
              <>
                <XCircle size={16} color="var(--color-danger)" aria-hidden="true" />
                <span style={{ color: 'var(--color-danger-text)' }}>AI Prediction Model Result</span>
              </>
            )}
          </div>

          <h2
            className={`prediction-outcome-title ${
              isSuccess ? 'outcome-success' : 'outcome-failure'
            }`}
          >
            {predictionData.prediction || (isSuccess ? 'Successful Outcome' : 'Failure')}
          </h2>

          <div className="probability-metric-row">
            <div className="prob-metric">
              <span className="prob-metric-label">Success Probability</span>
              <span className="prob-metric-val success">
                {formatPercentage(successProb)}
              </span>
            </div>

            <div className="prob-metric">
              <span className="prob-metric-label">Failure Probability</span>
              <span className="prob-metric-val failure">
                {formatPercentage(failureProb)}
              </span>
            </div>

            <div className="prob-metric">
              <span className="prob-metric-label">Risk Assessment</span>
              <div style={{ marginTop: '0.35rem' }}>
                <RiskBadge risk={riskLevel} size="large" />
              </div>
            </div>
          </div>

          {/* Visual probability split bar */}
          <div className="prob-split-bar" title={`Success: ${successProb}% | Failure: ${failureProb}%`}>
            <div
              className="prob-bar-success"
              style={{ width: `${Math.min(100, Math.max(0, successProb))}%` }}
            />
            <div
              className="prob-bar-failure"
              style={{ width: `${Math.min(100, Math.max(0, failureProb))}%` }}
            />
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
            {isSuccess
              ? `The XGBoost classifier projects high commercial viability (${formatPercentage(
                  successProb
                )}) based on funding efficiency, traction velocity, and regional market positioning.`
              : `The model identifies notable structural friction (${formatPercentage(
                  failureProb
                )} failure likelihood). Consider accelerating funding rounds or improving capital efficiency per round.`}
          </p>
        </div>

        {/* Visual summary indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'var(--bg-card-subtle)',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isSuccess ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: isSuccess ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            }}
          >
            {isSuccess ? <TrendingUp size={32} /> : <AlertTriangle size={32} />}
          </div>
          <span style={{ fontSize: '0.785rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Model Confidence
          </span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-heading)',
              marginTop: '0.2rem',
            }}
          >
            {formatPercentage(Math.max(successProb, failureProb))}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Evaluation Model: XGBoost Classifier
          </span>
        </div>
      </div>
    </div>
  );
}
