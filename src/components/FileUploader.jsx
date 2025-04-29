import React from 'react';
import { useDispatch } from 'react-redux';
import Papa from 'papaparse';

const FileUploader = () => {
  const dispatch = useDispatch();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const { data, meta } = results;
          const processedData = data.map(row => {
            const newRow = { ...row };
            if (row.Date) {
              try {
                const date = new Date(row.Date);
                newRow.Date_Year = date.getFullYear();
                newRow.Date_Month = date.getMonth() + 1;
                newRow.Date_Day = date.getDate();
              } catch (e) {
                console.log(`err : ${e}`)
              }
            }
            return newRow;
          });
          
          dispatch.pivot.setRawData(processedData);
          dispatch.pivot.setHeaders(meta.fields);
        },
        error: (err) => {
          console.error('CSV parsing error:', err);
          alert('Error parsing CSV file');
        }
      });
    }
  };

  return (
    <div className="file-uploader">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".csv"
      />
    </div>
  );
};

export default FileUploader;