import React, { useState, useCallback } from 'react';

/**
 * Form to update COD Human State
 * Allows quick check-ins for energy, focus, stress, sleep, and time available
 */
export function HumanStateForm({
  currentState,
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    energy: currentState?.energy ?? 0.5,
    focusCapacity: currentState?.focusCapacity || 'med',
    stress: currentState?.stress ?? 0.3,
    sleepHours: currentState?.sleepDebt ? 8 - currentState.sleepDebt : 7,
    timeAvailableMin: currentState?.timeAvailableMin || 60,
    source: 'moment-check',
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="cod-form" onSubmit={handleSubmit}>
      <div className="cod-form__header">
        <h3 className="cod-form__title">Update Human State</h3>
        <span className="cod-form__subtitle">Quick check-in</span>
      </div>

      {/* Energy Slider */}
      <div className="cod-form__field">
        <label className="cod-form__label">
          <span>⚡ Energy</span>
          <span className="cod-form__value">
            {Math.round(formData.energy * 100)}%
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={formData.energy}
          onChange={(e) => handleChange('energy', parseFloat(e.target.value))}
          className="cod-form__slider"
        />
        <div className="cod-form__hints">
          <span>Exhausted</span>
          <span>Energized</span>
        </div>
      </div>

      {/* Focus Capacity */}
      <div className="cod-form__field">
        <label className="cod-form__label">🎯 Focus Capacity</label>
        <div className="cod-form__button-group">
          {['low', 'med', 'high'].map((level) => (
            <button
              key={level}
              type="button"
              className={`cod-form__toggle ${formData.focusCapacity === level ? 'cod-form__toggle--active' : ''}`}
              onClick={() => handleChange('focusCapacity', level)}
            >
              {level === 'low' ? 'Low' : level === 'med' ? 'Medium' : 'High'}
            </button>
          ))}
        </div>
      </div>

      {/* Stress Slider */}
      <div className="cod-form__field">
        <label className="cod-form__label">
          <span>🧘 Stress</span>
          <span className="cod-form__value">
            {Math.round(formData.stress * 100)}%
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={formData.stress}
          onChange={(e) => handleChange('stress', parseFloat(e.target.value))}
          className="cod-form__slider cod-form__slider--stress"
        />
        <div className="cod-form__hints">
          <span>Calm</span>
          <span>Stressed</span>
        </div>
      </div>

      {/* Sleep Hours */}
      <div className="cod-form__field">
        <label className="cod-form__label">
          <span>😴 Sleep (last night)</span>
          <span className="cod-form__value">{formData.sleepHours}h</span>
        </label>
        <input
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={formData.sleepHours}
          onChange={(e) =>
            handleChange('sleepHours', parseFloat(e.target.value))
          }
          className="cod-form__slider"
        />
        <div className="cod-form__hints">
          <span>0h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Time Available */}
      <div className="cod-form__field">
        <label className="cod-form__label">
          <span>⏱️ Time Available</span>
          <span className="cod-form__value">
            {formData.timeAvailableMin} min
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="480"
          step="15"
          value={formData.timeAvailableMin}
          onChange={(e) =>
            handleChange('timeAvailableMin', parseInt(e.target.value))
          }
          className="cod-form__slider"
        />
        <div className="cod-form__hints">
          <span>0</span>
          <span>8h</span>
        </div>
      </div>

      {/* Check-in Type */}
      <div className="cod-form__field">
        <label className="cod-form__label">Check-in Type</label>
        <div className="cod-form__button-group">
          {[
            { value: 'morning-check', label: '🌅 Morning' },
            { value: 'moment-check', label: '⏰ Moment' },
            { value: 'manual', label: '📝 Manual' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`cod-form__toggle ${formData.source === value ? 'cod-form__toggle--active' : ''}`}
              onClick={() => handleChange('source', value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="cod-form__actions">
        <button
          type="button"
          className="cod-button cod-button--secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="cod-button cod-button--primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Check-in'}
        </button>
      </div>
    </form>
  );
}

export default HumanStateForm;
