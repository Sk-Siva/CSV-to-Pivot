import React, { useEffect } from 'react';
import '../styles/styles.css';

const PivotConfigurator = ({ headers = [], numericHeaders = [], pivotConfig, setPivotConfig }) => {
  const { rowFields = [], colFields = [], valFields = [], aggregateFuncs = {} } = pivotConfig;

  let allFields = [...new Set([...headers, ...numericHeaders])];
  if (headers.includes("Date")) {
    if (!allFields.includes("Date_Year")) allFields.push("Date_Year");
    if (!allFields.includes("Date_Month")) allFields.push("Date_Month");
    if (!allFields.includes("Date_Day")) allFields.push("Date_Day");
  }

  useEffect(() => {
    setPivotConfig(prev => {
      const updatedFuncs = { ...prev.aggregateFuncs };
      prev.valFields.forEach(field => {
        if (!updatedFuncs[field]) updatedFuncs[field] = 'sum';
      });
      return { ...prev, aggregateFuncs: updatedFuncs };
    });
  }, [valFields, setPivotConfig]);

  const handleDrop = (e, zone) => {
    const field = e.dataTransfer.getData('field');
    const type = e.dataTransfer.getData('type');
    if (zone === 'rowFields' && colFields.includes(field)) {
      alert('This field is already in the column area.');
      return;
    }
    if (zone === 'colFields' && rowFields.includes(field)) {
      alert('This field is already in the row area.');
      return;
    }

    if (zone === 'valFields' && type !== 'numeric') return;

    setPivotConfig(prev => {
      if (prev[zone].includes(field)) return prev;
      return { ...prev, [zone]: [...prev[zone], field] };
    });
  };

  const removeField = (zone, field) => {
    setPivotConfig(prev => ({
      ...prev,
      [zone]: prev[zone].filter(f => f !== field),
      aggregateFuncs: zone === 'valFields' ? { ...prev.aggregateFuncs, [field]: undefined } : prev.aggregateFuncs
    }));
  };

  const onDragStart = (e, field, type) => {
    e.dataTransfer.setData('field', field);
    e.dataTransfer.setData('type', type);
    if (["Date_Year", "Date_Month", "Date_Day"].includes(field)) {
      e.dataTransfer.setData('isDerivedDate', 'true');
    }
  };

  const toggleField = (field) => {
    setPivotConfig(prev => {
      const alreadySelected = prev.rowFields.includes(field) || prev.colFields.includes(field) || prev.valFields.includes(field);
      if (alreadySelected) {
        return {
          ...prev,
          rowFields: prev.rowFields.filter(f => f !== field),
          colFields: prev.colFields.filter(f => f !== field),
          valFields: prev.valFields.filter(f => f !== field),
          aggregateFuncs: { ...prev.aggregateFuncs, [field]: undefined }
        };
      } else {
        const isNumeric = numericHeaders.includes(field);
        return {
          ...prev,
          [isNumeric ? 'valFields' : 'rowFields']: [...prev[isNumeric ? 'valFields' : 'rowFields'], field],
          aggregateFuncs: isNumeric ? { ...prev.aggregateFuncs, [field]: 'sum' } : prev.aggregateFuncs
        };
      }
    });
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
          <div key={field} className="dropped-field" draggable onDragStart={(e) => onDragStart(e, field, 'header')}>
            {field}
            <button className="remove-btn" onClick={() => removeField(fieldKey, field)}>✖</button>
            {fieldKey === 'valFields' && (
              <select
                className="agg-select"
                value={aggregateFuncs[field]}
                onChange={(e) => updateAggregateFunc(field, e.target.value)}
              >
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );


  const updateAggregateFunc = (field, func) => {
    setPivotConfig(prev => ({
      ...prev,
      aggregateFuncs: { ...prev.aggregateFuncs, [field]: func }
    }));
  };

  return (
    <div className="pivot-ui">
      <div className="fields-panel">
        <h3>PivotTable Fields</h3>
        <p className='para'>Choose Fields to add to report :</p>
        <div className="scrollable-fields">
          {allFields.map(field => {
            const isNumeric = numericHeaders.includes(field);
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
                {field}
              </label>
            );
          })}
        </div>
        <p className='para'>Drag Fields between areas below :</p>
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