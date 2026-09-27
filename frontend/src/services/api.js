import axios from 'axios';

// Backend API URL configured through Vite environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to format errors consistently and prevent raw python stack traces from leaking
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected error occurred. Please try again.';

    if (!error.response) {
      // Network error or server not running
      friendlyMessage =
        'Unable to connect to StartupPulse API. Make sure the FastAPI backend is running.';
    } else {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 404) {
        friendlyMessage = typeof detail === 'string' ? detail : 'Resource not found.';
      } else if (status === 422) {
        friendlyMessage =
          'Prediction could not be completed. Please check your input and try again.';
      } else if (status === 503) {
        friendlyMessage =
          typeof detail === 'string'
            ? detail
            : 'Database service is currently unavailable.';
      } else if (status >= 500) {
        friendlyMessage =
          'Prediction could not be completed. Please check your input and try again.';
      } else if (typeof detail === 'string') {
        friendlyMessage = detail;
      }
    }

    const enhancedError = new Error(friendlyMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.isNetworkError = !error.response;

    return Promise.reject(enhancedError);
  }
);

/**
 * Root service status
 */
export async function getRoot() {
  const response = await apiClient.get('/');
  return response.data;
}

/**
 * Health check endpoint
 * Returns: { status, model, service, mongodb }
 */
export async function getHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

/**
 * Run ML prediction for startup characteristics
 * @param {Object} startupData
 * Expected schema:
 * {
 *   primary_category: string,
 *   funding_total_usd: number,
 *   country_code: string,
 *   state_code: string,
 *   region: string,
 *   city: string,
 *   funding_rounds: number,
 *   startup_age: number,
 *   years_to_first_funding: number,
 *   funding_per_round: number
 * }
 */
export async function predictStartup(startupData) {
  const total = Math.max(0, Number(startupData.funding_total_usd) || 0);
  const rounds = Math.max(1, parseInt(startupData.funding_rounds, 10) || 1);
  const canonicalFundingPerRound = Math.round((total / rounds) * 100) / 100;

  const payload = {
    primary_category: String(startupData.primary_category || '').trim(),
    funding_total_usd: total,
    country_code: String(startupData.country_code || 'Unknown').trim(),
    state_code: String(startupData.state_code || 'Unknown').trim(),
    region: String(startupData.region || 'Unknown').trim(),
    city: String(startupData.city || 'Unknown').trim(),
    funding_rounds: rounds,
    startup_age: Math.max(0, Number(startupData.startup_age) || 0),
    years_to_first_funding: Math.max(0, Number(startupData.years_to_first_funding) || 0),
    funding_per_round: canonicalFundingPerRound,
  };

  const response = await apiClient.post('/predict', payload);
  return response.data;
}

/**
 * Compute individual SHAP feature contributions for a startup
 * @param {Object} startupData
 */
export async function explainStartup(startupData) {
  const total = Math.max(0, Number(startupData.funding_total_usd) || 0);
  const rounds = Math.max(1, parseInt(startupData.funding_rounds, 10) || 1);
  const canonicalFundingPerRound = Math.round((total / rounds) * 100) / 100;

  const payload = {
    primary_category: String(startupData.primary_category || '').trim(),
    funding_total_usd: total,
    country_code: String(startupData.country_code || 'Unknown').trim(),
    state_code: String(startupData.state_code || 'Unknown').trim(),
    region: String(startupData.region || 'Unknown').trim(),
    city: String(startupData.city || 'Unknown').trim(),
    funding_rounds: rounds,
    startup_age: Math.max(0, Number(startupData.startup_age) || 0),
    years_to_first_funding: Math.max(0, Number(startupData.years_to_first_funding) || 0),
    funding_per_round: canonicalFundingPerRound,
  };

  const response = await apiClient.post('/explain', payload);
  return response.data;
}

/**
 * Fetch ML Model Information and benchmarks
 * Returns: { success, selected_model, selected_metrics, models, features }
 */
export async function getModelInfo() {
  const response = await apiClient.get('/model-info');
  return response.data;
}

/**
 * Fetch prediction history from MongoDB
 * @param {number} limit
 */
export async function getPredictionHistory(limit = 20) {
  const response = await apiClient.get('/history', {
    params: { limit },
  });
  return response.data;
}

/**
 * Fetch single prediction detail by ID
 * @param {string} predictionId
 */
export async function getPrediction(predictionId) {
  const response = await apiClient.get(`/history/${predictionId}`);
  return response.data;
}

export { API_URL };
export default apiClient;
