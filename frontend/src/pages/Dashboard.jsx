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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Cpu,
  Target,
  CheckCheck,
  TrendingUp,
  Percent,
  Layers,
  RotateCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { getModelInfo, getHealth } from '../services/api';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import { formatPercentage } from '../utils/formatters';

export default function Dashboard() {
  const [modelData, setModelData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [infoRes, healthRes] = await Promise.allSettled([
        getModelInfo(),
        getHealth(),
      ]);

      if (infoRes.status === 'fulfilled' && infoRes.value) {
        setModelData(infoRes.value);
      } else {
        throw new Error(
          infoRes.reason?.message ||
            'Unable to connect to StartupPulse API. Make sure the FastAPI backend is running.'
        );
      }

      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(
        err.message ||
          'Unable to connect to StartupPulse API. Make sure the FastAPI backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <LoadingState
          message="Loading model architecture benchmarks..."
          description="Fetching dynamic metrics from GET /model-info"
        />
      </div>
    );
  }

  if (error || !modelData) {
    return (
      <div className="content-wrapper">
        <div className="error-banner">
          <AlertCircle size={22} color="#FB7185" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong>Unable to Load Model Benchmarks</strong>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
            <div style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={fetchData}
                style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
              >
                <RotateCw size={13} />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedMetrics = modelData.selected_metrics || {};
  const selectedModelName = modelData.selected_model || 'XGBoost';
  const modelsList = modelData.models || [];
  const featuresList = modelData.features || [];

  // Format model comparison chart data
  const comparisonChartData = modelsList.map((m) => ({
    name: m.Model || 'Unknown',
    Accuracy: Number((m.Accuracy * 100).toFixed(2)),
    Precision: Number((m.Precision * 100).toFixed(2)),
    Recall: Number((m.Recall * 100).toFixed(2)),
    F1: Number((m.F1 * 100).toFixed(2)),
    'ROC-AUC': Number((m.ROC_AUC * 100).toFixed(2)),
  }));

  // Format radar data for selected model
  const radarData = [
    {
      metric: 'Accuracy',
      value: Number((selectedMetrics.Accuracy * 100).toFixed(1)) || 0,
      fullMark: 100,
    },
    {
      metric: 'Precision',
      value: Number((selectedMetrics.Precision * 100).toFixed(1)) || 0,
      fullMark: 100,
    },
    {
      metric: 'Recall',
      value: Number((selectedMetrics.Recall * 100).toFixed(1)) || 0,
      fullMark: 100,
    },
    {
      metric: 'F1 Score',
      value: Number((selectedMetrics.F1 * 100).toFixed(1)) || 0,
      fullMark: 100,
    },
    {
      metric: 'ROC-AUC',
      value: Number((selectedMetrics.ROC_AUC * 100).toFixed(1)) || 0,
      fullMark: 100,
    },
  ];

  return (
    <div className="content-wrapper">
      <div className="dashboard-container">
        {/* Dashboard Topbar */}
        <div className="dashboard-topbar">
          <div>
            <div className="model-badge-lockup">
              <span className="model-tag">
                Production Model: {selectedModelName}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>·</span>
              <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                Features Evaluated: {featuresList.length}
              </span>
            </div>
            <h1 className="page-title" style={{ marginTop: '0.4rem', marginBottom: 0 }}>
              Model Evaluation & Analytics
            </h1>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchData}
            title="Refresh metrics from backend"
          >
            <RotateCw size={14} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {/* 5 Dynamic Metric Stat Cards */}
        <div className="grid-5">
          <StatCard
            label="Accuracy"
            value={formatPercentage(Number(selectedMetrics.Accuracy) * 100)}
            subtext="Overall correct classification"
            icon={Target}
          />
          <StatCard
            label="Precision"
            value={formatPercentage(Number(selectedMetrics.Precision) * 100)}
            subtext="Positive prediction validity"
            icon={CheckCheck}
          />
          <StatCard
            label="Recall"
            value={formatPercentage(Number(selectedMetrics.Recall) * 100)}
            subtext="True positive detection rate"
            icon={TrendingUp}
          />
          <StatCard
            label="F1 Score"
            value={formatPercentage(Number(selectedMetrics.F1) * 100)}
            subtext="Harmonic mean of P & R"
            icon={Percent}
          />
          <StatCard
            label="ROC-AUC"
            value={formatPercentage(Number(selectedMetrics.ROC_AUC) * 100)}
            subtext="Separability threshold metric"
            icon={Cpu}
          />
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Chart 1: Model Comparison Bar Chart */}
          <div className="sp-card chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Model Comparison Matrix</h3>
                <p className="chart-desc">
                  Performance across candidate algorithms from model_comparison.csv
                </p>
              </div>
            </div>

            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} domain={[60, 100]} tickLine={false} unit="%" />
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
                  <Legend
                    wrapperStyle={{ fontSize: '0.785rem', paddingTop: '10px' }}
                  />
                  <Bar dataKey="Accuracy" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Precision" fill="#818CF8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#34D399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ROC-AUC" fill="#F472B6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Metric Radar Representation */}
          <div className="sp-card chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">XGBoost Metric Topology</h3>
                <p className="chart-desc">Balance of precision, recall, and discriminative power</p>
              </div>
            </div>

            <div className="chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-subtle)" />
                  <PolarAngleAxis dataKey="metric" stroke="var(--text-muted)" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-dim)" fontSize={10} />
                  <Radar
                    name="XGBoost Benchmark"
                    dataKey="value"
                    stroke="#38BDF8"
                    fill="#38BDF8"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-elevated)',
                    }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Global Feature Importance Section */}
        <div className="sp-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Global Model Explanation
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', marginTop: '0.2rem' }}>
                Global Feature Importance
              </h3>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Source: ml/models/shap/feature_importance.csv
            </div>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', maxWidth: '75ch', lineHeight: '1.6' }}>
            Answers: <strong style={{ color: 'var(--text-heading)' }}>"What features generally influence this model across the entire dataset?"</strong> Unlike the Individual Prediction Explanation on the Results page (which explains a specific startup's score), this view captures overall model sensitivity across all historical startup benchmarks using mean absolute SHAP values.
          </p>

          <div style={{ width: '100%', height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  (modelData.global_feature_importance && modelData.global_feature_importance.length > 0)
                    ? modelData.global_feature_importance.slice(0, 10)
                    : [
                        { feature: 'Funding Total', importance: 0.5397 },
                        { feature: 'Startup Age', importance: 0.3487 },
                        { feature: 'Category: Unknown', importance: 0.2232 },
                        { feature: 'Funding Rounds', importance: 0.1657 },
                        { feature: 'Country: USA', importance: 0.1345 },
                        { feature: 'Funding Per Round', importance: 0.1078 },
                        { feature: 'Years to 1st Funding', importance: 0.0950 },
                        { feature: 'Region: SF Bay Area', importance: 0.0454 },
                        { feature: 'Category: CleanTech', importance: 0.0282 },
                        { feature: 'Region: Boston', importance: 0.0214 },
                      ]
                }
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    boxShadow: 'var(--shadow-elevated)',
                  }}
                  formatter={(val) => [val, 'Mean |SHAP| Value']}
                />
                <Bar dataKey="importance" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Features Used Section */}
        <div className="sp-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              Features Used ({featuresList.length})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              POST /predict Schema
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            The machine learning pipeline evaluates the following 10 dimensional features during inference:
          </p>

          <div className="features-container">
            {featuresList.map((feat, index) => (
              <div key={feat} className="feature-pill">
                <span className="num-index">{(index + 1).toString().padStart(2, '0')}.</span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About the Model Section */}
        <div className="about-model-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <HelpCircle size={20} color="var(--accent-cyan)" />
            <h3 style={{ margin: 0 }}>About the Model</h3>
          </div>
          <p>
            StartupPulse uses machine learning to estimate startup outcome probabilities from the supplied startup characteristics. The underlying engine executes an optimized extreme gradient boosting (XGBoost) classifier trained on empirical company trajectories. By capturing non-linear interactions between total capital raised, the cadence and timing of funding rounds, and the startup's operational lifespan, the model produces calibrated estimates of venture survival and risk levels.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              flexWrap: 'wrap',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Supervised Learning:</strong> Binary outcome (Successful Outcome vs Failure)
            </div>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Calibration:</strong> Probabilistic scoring via <code>predict_proba</code>
            </div>
            <div>
              <strong style={{ color: 'var(--text-heading)' }}>Risk Stratification:</strong> Low (≥70%), Medium (45–69%), High (&lt;45%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
