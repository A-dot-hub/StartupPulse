import React, { createContext, useContext, useState, useEffect } from 'react';
import { getHealth } from '../services/api';

const PredictionContext = createContext(null);

const STORAGE_KEY = 'startuppulse_latest_prediction';

const DEFAULT_STARTUP = {
  primary_category: 'Software',
  funding_total_usd: 5000000,
  country_code: 'USA',
  state_code: 'CA',
  region: 'SF Bay Area',
  city: 'San Francisco',
  funding_rounds: 3,
  startup_age: 5,
  years_to_first_funding: 1,
  funding_per_round: 1666666.67,
};

export function PredictionProvider({ children }) {
  const [latestPrediction, setLatestPredictionState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [backendHealth, setBackendHealth] = useState({
    status: 'checking', // 'healthy' | 'unreachable' | 'checking'
    details: null,
    lastChecked: null,
  });

  const setLatestPrediction = (predictionData) => {
    setLatestPredictionState(predictionData);
    try {
      if (predictionData) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(predictionData));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Session storage error:', e);
    }
  };

  const checkConnection = async () => {
    try {
      const data = await getHealth();
      setBackendHealth({
        status: data?.status === 'healthy' ? 'healthy' : 'degraded',
        details: data,
        lastChecked: new Date(),
      });
      return true;
    } catch (err) {
      setBackendHealth({
        status: 'unreachable',
        details: null,
        lastChecked: new Date(),
        error: err.message,
      });
      return false;
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <PredictionContext.Provider
      value={{
        latestPrediction,
        setLatestPrediction,
        defaultStartup: DEFAULT_STARTUP,
        backendHealth,
        checkConnection,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}
