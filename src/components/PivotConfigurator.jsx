import React, { useEffect, useMemo } from 'react';
import '../styles/styles.css';

const PivotConfigurator = ({ headers = [], pivotConfig, setPivotConfig, data = [] }) => {
  const { rowFields = [], colFields = [], valFields = [], aggregateFuncs = {} } = pivotConfig;

  const fieldValueMap = useMemo(() => {
    return headers.reduce((map, header) => {
      map[header] = data.map(row => row[header]).filter(v => v !== undefined && v !== null);
      return map;
    }, {});
  }, [headers, data]);

  const isNumericValue = (v) => {
    if (typeof v !== 'string' && typeof v !== 'number') return false;
    return !isNaN(parseFloat(String(v).replace(/[$€₹,]/g, '').trim()));
  };

  const isNumericField = (field) => {
    const lcField = field.toLowerCase();
    if (['date', 'year', 'month', 'day'].some(p => lcField.includes(p))) return false;
    if (['price', 'amount', 'total', 'sum', 'value', 'cost', 'quantity', 'percent', 'rate', 'ratio', 'salary', 'revenue'].some(p => lcField.includes(p))) return true;
    return (fieldValueMap[field] || []).some(isNumericValue);
  };

  const allFields = useMemo(() => {
    const base = new Set(headers);
    if (base.has('Date')) {
      ['Date_Year', 'Date_Month', 'Date_Day'].forEach(f => base.add(f));
    }
    return [...base];
  }, [headers]);

  useEffect(() => {
    setPivotConfig(prev => {
      const updatedFuncs = { ...prev.aggregateFuncs };
      prev.valFields.forEach(f => { if (!updatedFuncs[f]) updatedFuncs[f] = 'sum'; });
      return { ...prev, aggregateFuncs: updatedFuncs };
    });
  }, [valFields, setPivotConfig]);

  const handleDrop = (e, zone) => {
    const field = e.dataTransfer.getData('field');
    if (!field || pivotConfig[zone].includes(field)) return;

    const isNumeric = isNumericField(field);
    if ((zone === 'valFields' && !isNumeric) || ((zone === 'rowFields' || zone === 'colFields') && isNumeric)) return;
    if ((zone === 'rowFields' && colFields.includes(field)) || (zone === 'colFields' && rowFields.includes(field))) return;

    setPivotConfig(prev => ({ ...prev, [zone]: [...prev[zone], field] }));
  };

  const removeField = (zone, field) => {
    setPivotConfig(prev => ({
      ...prev,
      [zone]: prev[zone].filter(f => f !== field),
      aggregateFuncs: zone === 'valFields' ? { ...prev.aggregateFuncs, [field]: undefined } : prev.aggregateFuncs
    }));
  };

  const onDragStart = (e, field) => {
    e.dataTransfer.setData('field', field);
    e.dataTransfer.setData('type', isNumericField(field) ? 'numeric' : 'header');
    if (['Date_Year', 'Date_Month', 'Date_Day'].includes(field)) {
      e.dataTransfer.setData('isDerivedDate', 'true');
    }
  };

  const toggleField = (field) => {
    const isNumeric = isNumericField(field);
    setPivotConfig(prev => {
      const inAny = rowFields.includes(field) || colFields.includes(field) || valFields.includes(field);
      if (inAny) {
        return {
          ...prev,
          rowFields: prev.rowFields.filter(f => f !== field),
          colFields: prev.colFields.filter(f => f !== field),
          valFields: prev.valFields.filter(f => f !== field),
          aggregateFuncs: { ...prev.aggregateFuncs, [field]: undefined }
        };
      }
      if (isNumeric) {
        return {
          ...prev,
          valFields: [...prev.valFields, field],
          aggregateFuncs: { ...prev.aggregateFuncs, [field]: 'sum' }
        };
      }
      return { ...prev, rowFields: [...prev.rowFields, field] };
    });
  };

  const updateAggregateFunc = (field, func) => {
    setPivotConfig(prev => ({
      ...prev,
      aggregateFuncs: { ...prev.aggregateFuncs, [field]: func }
    }));
  };

  const renderDropZone = (label, fieldKey, fields) => (
    <div className='drop-container'>
      <p>{label}</p>
      <div
        className={`drop-zone ${fieldKey}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, fieldKey)}
      >
        {fields.map(field => (
          <div
            key={field}
            className="dropped-field"
            draggable
            onDragStart={(e) => onDragStart(e, field)}
          >
            {fieldKey === 'valFields' && isNumericField(field) ? `∑ ${field}` : field}
            <button className="remove-btn" onClick={() => removeField(fieldKey, field)}>✖</button>
            {fieldKey === 'valFields' && isNumericField(field) && (
              <select
                className="agg-select"
                value={aggregateFuncs[field] || 'sum'}
                onChange={(e) => updateAggregateFunc(field, e.target.value)}
              >
                {['sum', 'avg', 'count', 'min', 'max'].map(func => (
                  <option key={func} value={func}>{func.toUpperCase()}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pivot-ui">
      <div className="fields-panel">
        <h3>PivotTable Fields</h3>
        <p className='para'>Choose Fields to add to report:</p>
        <div className="scrollable-fields">
          {allFields.map(field => {
            const isNumeric = isNumericField(field);
            const selected = rowFields.includes(field) || colFields.includes(field) || valFields.includes(field);
            return (
              <label
                key={field}
                className={`field-item ${isNumeric ? 'numeric' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, field)}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleField(field)}
                />
                {isNumeric ? `∑ ${field}` : field}
              </label>
            );
          })}
        </div>
        <p className='para'>Drag Fields between areas below:</p>
      </div>
      <div className="dropzones-panel">
        {renderDropZone('Rows', 'rowFields', rowFields)}
        {renderDropZone('Columns', 'colFields', colFields)}
        {renderDropZone('Values', 'valFields', valFields)}
      </div>
    </div>
  );
};

export default PivotConfigurator;