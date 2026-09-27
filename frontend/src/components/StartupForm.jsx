import React, { useState, useEffect } from 'react';
import { Sparkles, Calculator, AlertCircle, Edit3 } from 'lucide-react';

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
  const initialCategory = initialValues.primary_category || 'Software';
  const isInitialCustom = !CATEGORY_OPTIONS.slice(0, -1).includes(initialCategory);

  const [selectedDropdown, setSelectedDropdown] = useState(
    isInitialCustom ? 'Other' : initialCategory
  );
  const [customCategory, setCustomCategory] = useState(
    isInitialCustom ? initialCategory : ''
  );

  const [formData, setFormData] = useState({
    primary_category: initialCategory,
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

  // Sync if initialValues change externally
  useEffect(() => {
    if (initialValues.primary_category) {
      const isCustom = !CATEGORY_OPTIONS.slice(0, -1).includes(initialValues.primary_category);
      if (isCustom) {
        setSelectedDropdown('Other');
        setCustomCategory(initialValues.primary_category);
      } else {
        setSelectedDropdown(initialValues.primary_category);
        setCustomCategory('');
      }
    }
  }, [initialValues.primary_category]);

  const validate = () => {
    const errs = {};

    const effectiveCategory =
      selectedDropdown === 'Other' ? customCategory.trim() : formData.primary_category.trim();

    if (!effectiveCategory) {
      errs.primary_category =
        selectedDropdown === 'Other'
          ? 'Please enter your custom category.'
          : 'Primary category is required.';
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

  const handleDropdownCategoryChange = (val) => {
    setSelectedDropdown(val);
    if (val === 'Other') {
      setFormData((prev) => ({
        ...prev,
        primary_category: customCategory.trim(),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        primary_category: val,
      }));
    }

    if (errors.primary_category) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.primary_category;
        return updated;
      });
    }
  };

  const handleCustomCategoryInput = (val) => {
    setCustomCategory(val);
    setFormData((prev) => ({
      ...prev,
      primary_category: val,
    }));

    if (errors.primary_category && val.trim()) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.primary_category;
        return updated;
      });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Canonical formula: funding_per_round = funding_total_usd / funding_rounds
      // Always keep funding_per_round synchronized and mathematically consistent
      if (field === 'funding_total_usd' || field === 'funding_rounds') {
        const total = field === 'funding_total_usd' ? (Number(value) || 0) : (Number(prev.funding_total_usd) || 0);
        const rounds = Math.max(1, parseInt(field === 'funding_rounds' ? value : prev.funding_rounds, 10) || 1);
        updated.funding_per_round = Math.round((total / rounds) * 100) / 100;
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        if (field === 'funding_total_usd' || field === 'funding_rounds') {
          delete updated.funding_per_round;
        }
        return updated;
      });
    }
  };

  const autoCalcFundingPerRound = () => {
    const total = Number(formData.funding_total_usd) || 0;
    const rounds = Math.max(1, parseInt(formData.funding_rounds, 10) || 1);
    const perRound = Math.round((total / rounds) * 100) / 100;
    setFormData((prev) => ({
      ...prev,
      funding_per_round: perRound,
    }));
  };

  const loadPreset = (preset) => {
    const cat = preset.data.primary_category;
    if (CATEGORY_OPTIONS.slice(0, -1).includes(cat)) {
      setSelectedDropdown(cat);
      setCustomCategory('');
    } else {
      setSelectedDropdown('Other');
      setCustomCategory(cat);
    }
    const total = Number(preset.data.funding_total_usd) || 0;
    const rounds = Math.max(1, parseInt(preset.data.funding_rounds, 10) || 1);
    const perRound = Math.round((total / rounds) * 100) / 100;

    setFormData({
      ...preset.data,
      funding_per_round: perRound,
    });
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (validate()) {
      const finalCategory =
        selectedDropdown === 'Other' ? customCategory.trim() : formData.primary_category.trim();

      const total = Number(formData.funding_total_usd) || 0;
      const rounds = Math.max(1, parseInt(formData.funding_rounds, 10) || 1);
      const canonicalFundingPerRound = Math.round((total / rounds) * 100) / 100;

      onSubmit({
        ...formData,
        primary_category: finalCategory,
        funding_total_usd: total,
        funding_rounds: rounds,
        funding_per_round: canonicalFundingPerRound,
      });
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
            {selectedDropdown === 'Other' && (
              <span className="form-label-hint" style={{ color: 'var(--accent-cyan)' }}>
                Custom Entry
              </span>
            )}
          </label>
          <select
            id="primary_category"
            className="form-select"
            value={selectedDropdown}
            onChange={(e) => handleDropdownCategoryChange(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Other' ? 'Other (Enter custom category...)' : cat}
              </option>
            ))}
          </select>
          {errors.primary_category && selectedDropdown !== 'Other' && (
            <span className="form-error-msg">{errors.primary_category}</span>
          )}

          {/* Quick toggle if category is not listed */}
          {selectedDropdown !== 'Other' && (
            <div style={{ marginTop: '0.35rem', textAlign: 'right' }}>
              <button
                type="button"
                className="autocalc-btn"
                onClick={() => handleDropdownCategoryChange('Other')}
                style={{ fontSize: '0.75rem' }}
                title="Enter your custom startup category"
              >
                Category not in list? Click Other to enter
              </button>
            </div>
          )}

          {/* If 'Other' is selected, open custom category text box */}
          {selectedDropdown === 'Other' && (
            <div style={{ marginTop: '0.65rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  id="custom_category_input"
                  type="text"
                  className="form-input"
                  placeholder="Enter your custom category (e.g. AgriTech, Web3, Space)..."
                  value={customCategory}
                  onChange={(e) => handleCustomCategoryInput(e.target.value)}
                  autoFocus
                  style={{
                    borderColor: errors.primary_category ? 'var(--color-danger)' : 'var(--border-focus)',
                    paddingRight: '2.5rem',
                  }}
                />
                <Edit3
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Type your custom industry sector
                </span>
                <button
                  type="button"
                  onClick={() => handleDropdownCategoryChange('Software')}
                  className="autocalc-btn"
                  style={{ fontSize: '0.75rem' }}
                >
                  Choose standard category
                </button>
              </div>
              {errors.primary_category && (
                <span className="form-error-msg">{errors.primary_category}</span>
              )}
            </div>
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
            <span className="form-label-hint" style={{ color: 'var(--accent-cyan)' }}>
              Auto: Total ÷ Rounds
            </span>
          </label>
          <input
            id="funding_per_round"
            type="number"
            min="0"
            step="1000"
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
