import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import RawCSVTable from './components/RawCSVTable';
import PivotConfigurator from './components/PivotConfigurator';
import PivotTable from './components/PivotTable';
import './styles/styles.css';

function App() {
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [numericHeaders, setNumericHeaders] = useState([]);
  const [pivotConfig, setPivotConfig] = useState({
    rowFields: [],
    colFields: [],
    valFields: [],
    aggregateFuncs: {},
  });

  useEffect(() => {
    if (rawData.length > 0 && headers.length > 0) {
      const isDate = (value) => {
        const parsed = Date.parse(value);
        return !isNaN(parsed) && isNaN(Number(value));
      };

      const numerics = headers.filter(header =>
        rawData.some(row => {
          const val = row[header];
          const num = parseFloat(val);
          return (
            val !== '' &&
            !isNaN(num) &&
            !isDate(val)
          );
        })
      );

      setNumericHeaders(numerics);
    }
  }, [rawData, headers]);

  const { rowFields, colFields, valFields, aggregateFuncs } = pivotConfig;

  return (
    <div className="mainApp">
      <h1 className="home">CSV to Pivot Table</h1>

      <FileUploader setRawData={setRawData} setHeaders={setHeaders} />

      {rawData.length > 0 && (
        <>
          <h2 className="section-title">Raw CSV Data Preview</h2>
          <RawCSVTable data={rawData} />
        </>
      )}

      <div className='pivot-container'>
        <PivotTable
          rawData={rawData}
          rowFields={rowFields}
          colFields={colFields}
          valFields={valFields}
          aggregateFuncs={aggregateFuncs}
        />
        {headers.length > 0 && (
          <PivotConfigurator
           data = {rawData}
            headers={headers}
            numericHeaders={numericHeaders}
            pivotConfig={pivotConfig}
            setPivotConfig={setPivotConfig}
          />
        )}
      </div>
    </div>
  );
}

export default App;
