import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, HelpCircle, Activity } from 'lucide-react';
import StartupForm from '../components/StartupForm';
import { predictStartup } from '../services/api';
import { usePrediction } from '../context/PredictionContext';

export default function Analyze() {
  const navigate = useNavigate();
  const { setLatestPrediction, defaultStartup } = usePrediction();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await predictStartup(formData);

      if (response && response.success && response.data) {
        // Save to state and navigate to /results
        const predictionRecord = {
          ...response.data,
          input: formData,
          prediction_id: response.prediction_id,
          saved_to_database: response.saved_to_database,
          timestamp: new Date().toISOString(),
        };

        setLatestPrediction(predictionRecord);
        navigate('/results');
      } else {
        throw new Error('Prediction could not be completed. Please check your input and try again.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setApiError(
        err.message ||
          'Prediction could not be completed. Please check your input and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="analyze-container">
        <div className="page-header">
          <h1 className="page-title">Analyze Your Startup</h1>
          <p className="page-subtitle">
            Enter startup characteristics to generate an AI-powered success and risk assessment.
          </p>
        </div>

        {apiError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={20} color="#FB7185" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Analysis Execution Error</strong>
              <p style={{ fontSize: '0.875rem' }}>{apiError}</p>
              {apiError.includes('FastAPI') && (
                <p style={{ fontSize: '0.785rem', color: '#CBD5E1', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  Tip: Start the backend using: <code>python -m uvicorn backend.main:app --port 8000</code>
                </p>
              )}
            </div>
          </div>
        )}

        <StartupForm
          initialValues={defaultStartup}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Analyze Startup"
          loadingLabel="Analyzing Startup..."
        />

        <div
          style={{
            marginTop: '2rem',
            padding: '1.25rem 1.5rem',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            color: 'var(--text-muted)',
            fontSize: '0.825rem',
            lineHeight: '1.6',
          }}
        >
          <HelpCircle size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong style={{ color: 'var(--text-heading)' }}>Evaluation Notice:</strong> All submissions are processed through the trained StartupPulse XGBoost pipeline. The model assesses non-linear interactions across capital efficiency, startup age, rounds, and geographic ecosystem liquidity to determine survival probability.
          </div>
        </div>
      </div>
    </div>
  );
}
