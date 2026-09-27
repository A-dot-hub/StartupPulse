import React, { useState } from 'react';
import { Sparkles, Calculator, AlertCircle } from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Software',
  'Biotechnology',
  'E-Commerce',
  'Enterprise',
  'Mobile',
  'HealthCare',
  'Finance',
  'CleanTech',
  'Security',
  'Hardware',
  'Advertising',
  'Analytics',
  'Games',
  'Education',
  'Real Estate',
  'Other',
];

const PRESETS = [
  {
    name: 'Growth SaaS (SF)',
    data: {
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
    },
  },
  {
    name: 'Seed FinTech (NYC)',
    data: {
      primary_category: 'Finance',
      funding_total_usd: 1800000,
      country_code: 'USA',
      state_code: 'NY',
      region: 'New York City',
      city: 'New York',
      funding_rounds: 1,
      startup_age: 2,
      years_to_first_funding: 0.8,
      funding_per_round: 1800000,
    },
  },
  {
    name: 'Early BioTech (Boston)',
    data: {
      primary_category: 'Biotechnology',
      funding_total_usd: 12500000,
      country_code: 'USA',
      state_code: 'MA',
      region: 'Boston',
      city: 'Cambridge',
      funding_rounds: 2,
      startup_age: 4,
      years_to_first_funding: 1.5,
      funding_per_round: 6250000,
    },
  },
];

export default function StartupForm({
  initialValues = {},
  onSubmit,
  isLoading = false,
  submitLabel = 'Analyze Startup',
  loadingLabel = 'Analyzing Startup...',
}) {
  const [formData, setFormData] = useState({
    primary_category: initialValues.primary_category || 'Software',
    funding_total_usd: initialValues.funding_total_usd ?? 5000000,
    country_code: initialValues.country_code || 'USA',
    state_code: initialValues.state_code || 'CA',
    region: initialValues.region || 'SF Bay Area',
    city: initialValues.city || 'San Francisco',
    funding_rounds: initialValues.funding_rounds ?? 3,
    startup_age: initialValues.startup_age ?? 5,
    years_to_first_funding: initialValues.years_to_first_funding ?? 1,
    funding_per_round: initialValues.funding_per_round ?? 1666666.67,
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!formData.primary_category || !formData.primary_category.trim()) {
      errs.primary_category = 'Primary category is required.';
    }

    if (
      formData.funding_total_usd === '' ||
      isNaN(formData.funding_total_usd) ||
      Number(formData.funding_total_usd) < 0
    ) {
      errs.funding_total_usd = 'Funding total must be 0 or greater.';
    }

    if (!formData.country_code || !formData.country_code.trim()) {
      errs.country_code = 'Country code is required (e.g. USA, IND, GBR).';
    }

    const rounds = Number(formData.funding_rounds);
    if (!formData.funding_rounds || isNaN(rounds) || rounds < 1 || !Number.isInteger(rounds)) {
      errs.funding_rounds = 'Funding rounds must be an integer of 1 or greater.';
    }

    if (
      formData.startup_age === '' ||
      isNaN(formData.startup_age) ||
      Number(formData.startup_age) < 0
    ) {
      errs.startup_age = 'Startup age must be 0 or greater.';
    }

    if (
      formData.years_to_first_funding === '' ||
      isNaN(formData.years_to_first_funding) ||
      Number(formData.years_to_first_funding) < 0
    ) {
      errs.years_to_first_funding = 'Years to first funding must be 0 or greater.';
    }

    if (
      formData.funding_per_round === '' ||
      isNaN(formData.funding_per_round) ||
      Number(formData.funding_per_round) < 0
    ) {
      errs.funding_per_round = 'Funding per round must be 0 or greater.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const autoCalcFundingPerRound = () => {
    const total = Number(formData.funding_total_usd) || 0;
    const rounds = Math.max(1, parseInt(formData.funding_rounds, 10) || 1);
    const perRound = Math.round((total / rounds) * 100) / 100;
    handleChange('funding_per_round', perRound);
  };

  const loadPreset = (preset) => {
    setFormData({ ...preset.data });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sp-card analyze-form" noValidate>
      {/* Presets bar */}
      <div className="presets-bar">
        <span className="presets-label">Quick Presets:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="preset-chip"
            onClick={() => loadPreset(preset)}
          >
            <Sparkles size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {preset.name}
          </button>
        ))}
      </div>

      {/* Section 1: Core Profile */}
      <div className="form-section-title">
        <span>01. Industry & Geographic Profile</span>
      </div>

      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="primary_category">
            Primary Category *
          </label>
          <select
            id="primary_category"
            className="form-select"
            value={formData.primary_category}
            onChange={(e) => handleChange('primary_category', e.target.value)}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.primary_category && (
            <span className="form-error-msg">{errors.primary_category}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="country_code">
            Country Code *
            <span className="form-label-hint">e.g. USA, IND, GBR</span>
          </label>
          <input
            id="country_code"
            type="text"
            className="form-input"
            maxLength={6}
            placeholder="USA"
            value={formData.country_code}
            onChange={(e) => handleChange('country_code', e.target.value.toUpperCase())}
          />
          {errors.country_code && (
            <span className="form-error-msg">{errors.country_code}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="state_code">
            State Code
            <span className="form-label-hint">e.g. CA, NY, MA</span>
          </label>
          <input
            id="state_code"
            type="text"
            className="form-input"
            maxLength={6}
            placeholder="CA"
            value={formData.state_code}
            onChange={(e) => handleChange('state_code', e.target.value.toUpperCase())}
          />
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="region">
            Region / Metro Area
            <span className="form-label-hint">e.g. SF Bay Area</span>
          </label>
          <input
            id="region"
            type="text"
            className="form-input"
            placeholder="SF Bay Area"
            value={formData.region}
            onChange={(e) => handleChange('region', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="city">
            City
            <span className="form-label-hint">e.g. San Francisco</span>
          </label>
          <input
            id="city"
            type="text"
            className="form-input"
            placeholder="San Francisco"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </div>
      </div>

      {/* Section 2: Capitalization & Timeline */}
      <div className="form-section-title" style={{ marginTop: '2rem' }}>
        <span>02. Capital Structure & Operating Timeline</span>
      </div>

      <div className="form-grid-3">
        <div className="form-group">
          <label className="form-label" htmlFor="funding_total_usd">
            Funding Total (USD) *
            <span className="form-label-hint">USD amount</span>
          </label>
          <input
            id="funding_total_usd"
            type="number"
            min="0"
            step="10000"
            className="form-input tabular-nums"
            placeholder="5000000"
            value={formData.funding_total_usd}
            onChange={(e) => handleChange('funding_total_usd', e.target.value)}
          />
          {errors.funding_total_usd && (
            <span className="form-error-msg">{errors.funding_total_usd}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="funding_rounds">
            Funding Rounds *
            <span className="form-label-hint">≥ 1 round</span>
          </label>
          <input
            id="funding_rounds"
            type="number"
            min="1"
            step="1"
            className="form-input tabular-nums"
            placeholder="3"
            value={formData.funding_rounds}
            onChange={(e) => handleChange('funding_rounds', e.target.value)}
          />
          {errors.funding_rounds && (
            <span className="form-error-msg">{errors.funding_rounds}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="funding_per_round">
            <span>Funding Per Round (USD) *</span>
            <button
              type="button"
              className="autocalc-btn"
              onClick={autoCalcFundingPerRound}
              title="Compute: Total / Rounds"
            >
              <Calculator size={11} style={{ display: 'inline', marginRight: '2px' }} />
              Auto-calculate
            </button>
          </label>
          <input
            id="funding_per_round"
            type="number"
            min="0"
            step="5000"
            className="form-input tabular-nums"
            placeholder="1666666.67"
            value={formData.funding_per_round}
            onChange={(e) => handleChange('funding_per_round', e.target.value)}
          />
          {errors.funding_per_round && (
            <span className="form-error-msg">{errors.funding_per_round}</span>
          )}
        </div>
      </div>

      <div className="form-grid-2">
        <div className="form-group">
          <label className="form-label" htmlFor="startup_age">
            Startup Age (Years) *
            <span className="form-label-hint">Founding to current</span>
          </label>
          <input
            id="startup_age"
            type="number"
            min="0"
            step="0.1"
            className="form-input tabular-nums"
            placeholder="5"
            value={formData.startup_age}
            onChange={(e) => handleChange('startup_age', e.target.value)}
          />
          {errors.startup_age && (
            <span className="form-error-msg">{errors.startup_age}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="years_to_first_funding">
            Years to First Funding *
            <span className="form-label-hint">Founding to 1st round</span>
          </label>
          <input
            id="years_to_first_funding"
            type="number"
            min="0"
            step="0.1"
            className="form-input tabular-nums"
            placeholder="1"
            value={formData.years_to_first_funding}
            onChange={(e) => handleChange('years_to_first_funding', e.target.value)}
          />
          {errors.years_to_first_funding && (
            <span className="form-error-msg">{errors.years_to_first_funding}</span>
          )}
        </div>
      </div>

      {/* Form Action buttons */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading && <span className="spinner" />}
          <span>{isLoading ? loadingLabel : submitLabel}</span>
        </button>
      </div>
    </form>
  );
}
