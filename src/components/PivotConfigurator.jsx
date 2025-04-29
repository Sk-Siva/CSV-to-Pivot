import React, { useEffect, useMemo } from 'react';
import '../styles/styles.css';
import { useDispatch, useSelector } from 'react-redux';

const PivotConfigurator = ({ headers = [], data = [] }) => {
  const dispatch = useDispatch();
  const pivotConfig = useSelector(state => state.pivot.pivotConfig);
  const { rowFields = [], colFields = [], valFields = [], aggregateFuncs = {} } = pivotConfig;

  const fieldValueMap = useMemo(() => {
    const map = {};
    headers.forEach(header => {
      map[header] = data.map(row => row[header]).filter(val => val !== undefined && val !== null);
    });
    return map;
  }, [headers, data]);

  const isNumericValue = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    const cleaned = String(value).replace(/[$€₹,]/g, '').trim();
    return !isNaN(parseFloat(cleaned));
  };

  const isNumericField = (field) => {
    const datePatterns = ['date', 'year', 'month', 'day'];
    if (datePatterns.some(p => field.toLowerCase().includes(p))) return false;
    const numericPatterns = [
      'price', 'amount', 'total', 'sum', 'value', 'cost',
      'quantity', 'percent', 'rate', 'ratio', 'salary', 'revenue'
    ];

    if (numericPatterns.some(p => field.toLowerCase().includes(p))) return true;

    const values = fieldValueMap[field] || [];
    return values.some(isNumericValue);
  };

  let allFields = [...new Set(headers)];
  if (headers.includes("Date")) {
    if (!allFields.includes("Date_Year")) allFields.push("Date_Year");
    if (!allFields.includes("Date_Month")) allFields.push("Date_Month");
    if (!allFields.includes("Date_Day")) allFields.push("Date_Day");
  }

  useEffect(() => {
    let needsUpdate = false;
    const updatedConfig = {
      ...pivotConfig,
      aggregateFuncs: { ...pivotConfig.aggregateFuncs }
    };
    
    valFields.forEach(field => {
      if (!updatedConfig.aggregateFuncs[field]) {
        updatedConfig.aggregateFuncs[field] = 'sum';
        needsUpdate = true;
      }
    });
    
    if (needsUpdate) {
      dispatch.pivot.updatePivotConfig(updatedConfig);
    }
  }, [valFields, dispatch.pivot]);

  const handleDrop = (e, zone) => {
    const field = e.dataTransfer.getData('field');
    const isNumeric = isNumericField(field);

    if (zone === 'valFields' && !isNumeric) return;
    if ((zone === 'rowFields' || zone === 'colFields') && isNumeric) {
      return;
    }

    if (zone === 'rowFields' && colFields.includes(field)) {
      return;
    }
    if (zone === 'colFields' && rowFields.includes(field)) {
      return;
    }

    const updatedConfig = { ...pivotConfig };
    if (!updatedConfig[zone].includes(field)) {
      updatedConfig[zone] = [...updatedConfig[zone], field];
      dispatch.pivot.updatePivotConfig(updatedConfig);
    }
  };

  const removeField = (zone, field) => {
    const updatedConfig = { ...pivotConfig };
    updatedConfig[zone] = updatedConfig[zone].filter(f => f !== field);
    
    if (zone === 'valFields') {
      updatedConfig.aggregateFuncs = { ...updatedConfig.aggregateFuncs };
      delete updatedConfig.aggregateFuncs[field];
    }
    
    dispatch.pivot.updatePivotConfig(updatedConfig);
  };

  const onDragStart = (e, field, type) => {
    e.dataTransfer.setData('field', field);
    e.dataTransfer.setData('type', isNumericField(field) ? 'numeric' : 'header');
    if (["Date_Year", "Date_Month", "Date_Day"].includes(field)) {
      e.dataTransfer.setData('isDerivedDate', 'true');
    }
  };

  const toggleField = (field) => {
    const updatedConfig = { ...pivotConfig };
    const isNumeric = isNumericField(field);

    if (isNumeric && !updatedConfig.valFields.includes(field)) {
      updatedConfig.valFields = [...updatedConfig.valFields, field];
      updatedConfig.aggregateFuncs = { 
        ...updatedConfig.aggregateFuncs, 
        [field]: 'sum' 
      };
    } else if (!isNumeric && !updatedConfig.rowFields.includes(field) && !updatedConfig.colFields.includes(field)) {
      updatedConfig.rowFields = [...updatedConfig.rowFields, field];
    } else {
      updatedConfig.rowFields = updatedConfig.rowFields.filter(f => f !== field);
      updatedConfig.colFields = updatedConfig.colFields.filter(f => f !== field);
      updatedConfig.valFields = updatedConfig.valFields.filter(f => f !== field);
      updatedConfig.aggregateFuncs = { ...updatedConfig.aggregateFuncs };
      delete updatedConfig.aggregateFuncs[field];
    }

    dispatch.pivot.updatePivotConfig(updatedConfig);
  };

  const renderDropZone = (label, fieldKey, fields) => (
    <div className='drop-container'>
      <p>{label}</p>
      <div
        className={`drop-zone ${fieldKey}`}
        data-zone={fieldKey}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, fieldKey)}
      >
        {fields.map(field => (
          <div
            key={field}
            className="dropped-field"
            draggable
            onDragStart={(e) => onDragStart(e, field, isNumericField(field) ? 'numeric' : 'header')}
          >
            {fieldKey === 'valFields' && isNumericField(field) ? `∑ ${field}` : field}
            <button className="remove-btn" onClick={() => removeField(fieldKey, field)}>✖</button>
            {fieldKey === 'valFields' && isNumericField(field) && (
              <select
                className="agg-select"
                value={aggregateFuncs[field] || 'sum'}
                onChange={(e) => updateAggregateFunc(field, e.target.value)}
              >
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
                <option value="min">MIN</option>
                <option value="max">MAX</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const updateAggregateFunc = (field, func) => {
    const updatedConfig = { ...pivotConfig };
    updatedConfig.aggregateFuncs = { 
      ...updatedConfig.aggregateFuncs, 
      [field]: func 
    };
    dispatch.pivot.updatePivotConfig(updatedConfig);
  };

  return (
    <div className="pivot-ui">
      <div className="fields-panel">
        <h3>PivotTable Fields</h3>
        <p className='para'>Choose Fields to add to report:</p>
        <div className="scrollable-fields">
          {allFields.map(field => {
            const isNumeric = isNumericField(field);
            const selected =
              rowFields.includes(field) || colFields.includes(field) || valFields.includes(field);

            return (
              <label
                key={field}
                className={`field-item ${isNumeric ? 'numeric' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, field, isNumeric ? 'numeric' : 'header')}
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