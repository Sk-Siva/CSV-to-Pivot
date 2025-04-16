import React, { useCallback } from 'react';
import '../styles/styles.css';

const PivotConfigurator = ({ headers, numericHeaders, pivotConfig, setPivotConfig }) => {
  const { rowFields, colFields, valFields, aggregateFunc } = pivotConfig;

  const updateField = useCallback((field, value) => {
    setPivotConfig(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(f => f !== value)
        : [...current, value];

      return { ...prev, [field]: updated };
    });
  }, [setPivotConfig]);

  const updateAggregateFunc = useCallback((func) => {
    setPivotConfig(prev => ({ ...prev, aggregateFunc: func }));
  }, [setPivotConfig]);

  const renderCheckboxGroup = (label, fieldKey, options) => (
    <div className="field-group">
      <strong>{label}:</strong>
      <div>
        {options.map(header => (
          <label key={`${fieldKey}-${header}`} className="checkbox-label">
            <input
              type="checkbox"
              checked={pivotConfig[fieldKey].includes(header)}
              onChange={() => updateField(fieldKey, header)}
            />
            {header}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="configurator">
      {renderCheckboxGroup('Rows', 'rowFields', headers)}
      {renderCheckboxGroup('Columns', 'colFields', headers)}
      {renderCheckboxGroup('Values', 'valFields', numericHeaders)}

      <div className="field-group">
        <strong>Aggregate Function:</strong>
        <div>
          {['sum', 'avg', 'count'].map(func => (
            <label key={func} className="radio-label">
              <input
                type="radio"
                name="aggregate"
                value={func}
                checked={aggregateFunc === func}
                onChange={() => updateAggregateFunc(func)}
              />
              {func.toUpperCase()}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PivotConfigurator;