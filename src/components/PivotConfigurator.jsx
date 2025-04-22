import React, { useCallback, useEffect } from 'react';
import '../styles/styles.css';

const PivotConfigurator = ({ headers = [], numericHeaders = [], pivotConfig, setPivotConfig }) => {
  const { rowFields = [], colFields = [], valFields = [], aggregateFuncs = {} } = pivotConfig;

  const updateField = useCallback((field, value) => {
    setPivotConfig(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(f => f !== value)
        : [...current, value];

      return { ...prev, [field]: updated };
    });
  }, [setPivotConfig]);

  useEffect(() => {
    setPivotConfig(prev => {
      const updatedFuncs = { ...prev.aggregateFuncs };
      prev.valFields.forEach(field => {
        if (!updatedFuncs[field]) {
          updatedFuncs[field] = 'sum';
        }
      });
      return { ...prev, aggregateFuncs: updatedFuncs };
    });
  }, [pivotConfig.valFields, setPivotConfig]);

  const updateAggregateFunc = useCallback((valField, func) => {
    setPivotConfig(prev => {
      const updatedFuncs = {
        ...prev.aggregateFuncs,
        [valField]: func
      };
      return {
        ...prev,
        aggregateFuncs: updatedFuncs
      };
    });
  }, [setPivotConfig]);

  const renderCheckboxGroup = (label, fieldKey, options) => (
    <div className="field-group">
      <strong>{label}:</strong>
      <div>
        {options.map(header => (
          <label key={`${fieldKey}-${header}`} className="checkbox-label">
            <input
              type="checkbox"
              checked={pivotConfig[fieldKey]?.includes(header)}
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
        <strong>Aggregate Function per Value:</strong>
        <div>
          {valFields.map(val => (
            <div key={`agg-${val}`} style={{ marginBottom: '4px' }}>
              {val}:
              {['sum', 'avg', 'count'].map(func => (
                <label key={`${val}-${func}`} className="radio-label" style={{ marginLeft: '10px' }}>
                  <input
                    type="radio"
                    name={`agg-${val}`}
                    value={func}
                    checked={aggregateFuncs[val] === func}
                    onChange={() => updateAggregateFunc(val, func)}
                  />
                  {func.toUpperCase()}
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PivotConfigurator;
