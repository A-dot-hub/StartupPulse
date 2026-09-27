import React from 'react';
import {
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function SHAPExplanation({
  explanation,
  isLoading = false,
  error = null,
}) {
  if (isLoading) {
    return (
      <div className="shap-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        <Loader2
          size={28}
          color="#38BDF8"
          style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }}
        />
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.2rem' }}>
          Analyzing prediction...
        </h4>
        <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
          Generating AI explanation with SHAP TreeExplainer...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shap-card" style={{ borderColor: 'rgba(244, 63, 94, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FB7185' }}>
          <AlertCircle size={20} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#FFFFFF' }}>
              Explanation Notice
            </strong>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
              Prediction generated successfully. Detailed explanation is temporarily unavailable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  const positiveFactors = explanation.positive_factors || [];
  const negativeFactors = explanation.negative_factors || [];

  // Determine maximum impact magnitude to scale bar widths accurately
  const allImpacts = [
    ...positiveFactors.map((f) => Math.abs(Number(f.impact) || 0)),
    ...negativeFactors.map((f) => Math.abs(Number(f.impact) || 0)),
  ];
  const maxImpact = Math.max(0.001, ...allImpacts);

  const formatDisplayValue = (val, featureName) => {
    if (val === undefined || val === null || val === 'N/A') return '';
    if (typeof val === 'number') {
      if (featureName.toLowerCase().includes('funding total') || featureName.toLowerCase().includes('per round')) {
        return formatCurrency(val, true);
      }
      if (featureName.toLowerCase().includes('rounds')) {
        return `${val} rds`;
      }
      if (featureName.toLowerCase().includes('age') || featureName.toLowerCase().includes('years')) {
        return `${val} yrs`;
      }
      return formatNumber(val);
    }
    return String(val);
  };

  return (
    <section className="shap-card" aria-label="Individual Prediction Explanation">
      {/* Header */}
      <div className="shap-header">
        <div className="shap-title-lockup">
          <div className="shap-icon-badge">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="shap-title">Why this prediction?</h3>
            <p className="shap-subtitle">
              Individual feature contributions calculated via XGBoost SHAP TreeExplainer
            </p>
          </div>
        </div>

        <div className="shap-meta-tag">
          Base: {explanation.base_value !== undefined ? Number(explanation.base_value).toFixed(3) : '0.00'} · Prediction: {explanation.prediction_value !== undefined ? Number(explanation.prediction_value).toFixed(3) : '0.00'}
        </div>
      </div>

      {/* Grid: Positive vs Negative Factors */}
      <div className="shap-grid">
        {/* Positive Factors */}
        <div className="shap-section">
          <div className="shap-section-header positive">
            <TrendingUp size={16} />
            <span>Factors increasing success probability</span>
          </div>

          <div className="shap-factors-list">
            {positiveFactors.length === 0 ? (
              <div className="shap-empty-subtext">No significant positive factors detected.</div>
            ) : (
              positiveFactors.map((factor, idx) => {
                const impactVal = Number(factor.impact) || 0;
                const barWidth = Math.min(100, Math.max(8, (Math.abs(impactVal) / maxImpact) * 100));
                const valDisplay = formatDisplayValue(factor.value, factor.feature);

                return (
                  <div key={`pos-${idx}`} className="shap-factor-item">
                    <div className="shap-factor-label-row">
                      <span className="shap-factor-name pos">
                        {factor.feature}
                      </span>
                      {valDisplay && (
                        <span className="shap-factor-val-pill">
                          val: {valDisplay}
                        </span>
                      )}
                    </div>

                    <div className="shap-factor-bar-row">
                      <div className="shap-bar-track">
                        <div
                          className="shap-bar-fill positive"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="shap-factor-impact positive">
                        +{impactVal.toFixed(3)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Negative Factors */}
        <div className="shap-section">
          <div className="shap-section-header negative">
            <TrendingDown size={16} />
            <span>Factors decreasing success probability</span>
          </div>

          <div className="shap-factors-list">
            {negativeFactors.length === 0 ? (
              <div className="shap-empty-subtext">No significant negative factors detected.</div>
            ) : (
              negativeFactors.map((factor, idx) => {
                const impactVal = Number(factor.impact) || 0;
                const barWidth = Math.min(100, Math.max(8, (Math.abs(impactVal) / maxImpact) * 100));
                const valDisplay = formatDisplayValue(factor.value, factor.feature);

                return (
                  <div key={`neg-${idx}`} className="shap-factor-item">
                    <div className="shap-factor-label-row">
                      <span className="shap-factor-name neg">
                        {factor.feature}
                      </span>
                      {valDisplay && (
                        <span className="shap-factor-val-pill">
                          val: {valDisplay}
                        </span>
                      )}
                    </div>

                    <div className="shap-factor-bar-row">
                      <div className="shap-bar-track">
                        <div
                          className="shap-bar-fill negative"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="shap-factor-impact negative">
                        −{Math.abs(impactVal).toFixed(3)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer explanation notice */}
      <div className="shap-footer-note">
        <span>
          Based on SHAP (SHapley Additive exPlanations) values computed on the exact startup attributes.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Info size={12} />
          <span>Bar magnitude = |SHAP contribution|</span>
        </div>
      </div>
    </section>
  );
}
