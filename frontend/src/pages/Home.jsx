import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  Sliders,
  History,
  ShieldAlert,
  Cpu,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import ProbabilityChart from '../components/ProbabilityChart';
import RiskBadge from '../components/RiskBadge';

export default function Home() {
  const featureList = [
    {
      title: 'ML-Powered Predictions',
      desc: 'Trained on tens of thousands of venture milestones to forecast real binary classification outcomes with high confidence.',
      icon: Cpu,
    },
    {
      title: 'Risk Analysis',
      desc: 'Multivariate calibration assesses capitalization burn, time-to-first-round friction, and regional market liquidity.',
      icon: ShieldAlert,
    },
    {
      title: 'Explainable Insights',
      desc: 'Breakdown of primary input drivers including capital per round, startup operating age, and geographic funding density.',
      icon: BarChart3,
    },
    {
      title: 'Prediction History',
      desc: 'Persistent MongoDB archive recording historical venture assessments for retrospective portfolio tracking.',
      icon: History,
    },
    {
      title: 'What-If Simulation',
      desc: 'Iteratively adjust funding rounds, total capital, and operating timeline to observe instantaneous changes in model predictions.',
      icon: Sliders,
    },
  ];

  const workflowSteps = [
    {
      num: '01',
      title: 'Enter Startup Data',
      desc: 'Provide sector, total capital raised, round frequency, geographic hub, and operating timeline.',
    },
    {
      num: '02',
      title: 'ML Analysis',
      desc: 'The XGBoost pipeline vectorizes categorical and numerical features for statistical evaluation.',
    },
    {
      num: '03',
      title: 'Risk Assessment',
      desc: 'Calibrated probabilistic scoring evaluates failure likelihood and stratifies low, medium, or high risk.',
    },
    {
      num: '04',
      title: 'Actionable Insights',
      desc: 'Explore scenario simulations to discover capital and round parameters that optimize success probability.',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, #0e1422 0%, #0a0e17 100%)',
          padding: '4.5rem 1.75rem 4rem',
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '3.5rem',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38BDF8',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <Sparkles size={14} />
              <span>Machine Learning Startup Analytics</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.4rem, 4.5vw, 3.5rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
                textWrap: 'balance',
              }}
            >
              AI-Powered Startup Success & Risk Analysis
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                color: '#94A3B8',
                lineHeight: 1.65,
                maxWidth: '56ch',
                marginBottom: '2rem',
              }}
            >
              Analyze startup characteristics using machine learning and understand the probability of success, failure, and risk.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/analyze" className="btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                <span>Analyze Your Startup</span>
                <ArrowRight size={16} />
              </Link>

              <Link to="/dashboard" className="btn-secondary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                <span>View Dashboard</span>
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.825rem',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} color="#10B981" />
                <span>Real XGBoost Inference</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} color="#10B981" />
                <span>10 Feature Vectors</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={15} color="#10B981" />
                <span>MongoDB Persistence</span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Preview Card */}
          <div
            className="sp-card"
            style={{
              background: 'linear-gradient(135deg, #131b2e 0%, #0f1626 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)',
              padding: '2rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                  Live Model Output Preview
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={20} />
                  Successful Outcome
                </h3>
              </div>
              <RiskBadge risk="Low" />
            </div>

            {/* Probability Chart */}
            <div style={{ margin: '1rem 0' }}>
              <ProbabilityChart
                successProbability={78.45}
                failureProbability={21.55}
                size={200}
                innerRadius={55}
                outerRadius={75}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>
                  Success Probability
                </span>
                <strong style={{ color: '#34D399', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                  78.45%
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>
                  Failure Probability
                </span>
                <strong style={{ color: '#FB7185', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                  21.55%
                </strong>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <Link to="/analyze" style={{ fontSize: '0.825rem', color: '#38BDF8', fontWeight: 600 }}>
                Test your own venture parameters →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="content-wrapper" style={{ padding: '4.5rem 1.75rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8' }}>
            Engine Capabilities
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
            Engineered for Precision Startup Intelligence
          </h2>
          <p style={{ color: '#94A3B8', maxWidth: '600px', margin: '0.75rem auto 0', fontSize: '0.95rem' }}>
            Comprehensive analytics combining supervised learning with empirical startup benchmark metrics.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {featureList.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="sp-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.75rem',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38BDF8',
                  }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', lineHeight: '1.6' }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Section */}
      <section
        style={{
          background: '#0D1320',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '4.5rem 1.75rem',
        }}
      >
        <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8' }}>
              Execution Lifecycle
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
              From Venture Inputs to Strategic Intelligence
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
            }}
          >
            {workflowSteps.map((step, idx) => (
              <div
                key={step.num}
                className="sp-card"
                style={{
                  background: '#111827',
                  padding: '2rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: '#38BDF8',
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: '1.6' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/analyze" className="btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
              <span>Start Analysis Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
