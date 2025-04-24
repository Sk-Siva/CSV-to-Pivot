import React, { useCallback } from 'react';
import Papa from 'papaparse';
import '../styles/styles.css';

const FileUploader = ({ setRawData, setHeaders }) => {
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        if (!data || data.length === 0) {
          console.warn('CSV file is empty or could not be parsed.');
          setRawData([]);
          setHeaders([]);
          return;
        }

        setRawData(data);
        setHeaders(Object.keys(data[0]));
      },
      error: (error) => {
        console.error('Error parsing CSV:', error.message);
      },
    });
  }, [setRawData, setHeaders]);

  return (
    <div className="fileInput">
      <input type="file" accept='.csv' onChange={handleFileUpload} />
    </div>
  );
};

export default FileUploader;