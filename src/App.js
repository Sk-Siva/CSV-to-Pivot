import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store';
import FileUploader from './components/FileUploader';
import RawCSVTable from './components/RawCSVTable';
import PivotTable from './components/PivotTable';
import PivotConfigurator from './components/PivotConfigurator';

const AppContent = () => {
  const dispatch = useDispatch();
  const { rawData, headers, pivotConfig, numericHeaders } = useSelector(state => state.pivot);
  const { rowFields, colFields, valFields, aggregateFuncs } = pivotConfig;

  useEffect(() => {
    if (rawData.length > 0 && headers.length > 0) {
      dispatch.pivot.processHeaders();
    }
  }, [rawData, headers, dispatch.pivot]);

  return (
    <div className="mainApp">
      <h1 className="home">CSV to Pivot Table</h1>
      
      <FileUploader />
      
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
            data={rawData}
            headers={headers}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;