export const formatHeader = str =>
    str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
export const getUniqueKeys = (data, fields) => {
    console.log(data)
    console.log(fields)
    const map = new Map();
    data.forEach(row => {
      const key = fields.map(f => row[f] ?? 'Total');
      const keyStr = key.join('|');
      map.set(keyStr, key);
    });
    return Array.from(map.values());
  };
  
export const buildPivotData = (rawData, rowFields, colFields, valFields, aggregateFunc) => {
    const rowKeys = rowFields.length ? getUniqueKeys(rawData, rowFields) : [['Total']];
    const colKeys = colFields.length ? getUniqueKeys(rawData, colFields) : [['Total']];
    console.log(rowKeys)
    console.log(colKeys)
  
    const pivot = {};
    const valueStore = {};
  
    rawData.forEach(row => {
      const rowKey = rowFields.length ? rowFields.map(f => row[f] ?? 'Total') : ['Total'];
      const colKey = colFields.length ? colFields.map(f => row[f] ?? 'Total') : ['Total'];
  
      const rowStr = rowKey.join('|');
      const colStr = colKey.join('|');
      console.log(rowKey)
      console.log(colKey)
      console.log(rowStr)
      console.log(colStr)
      if (!pivot[rowStr]) pivot[rowStr] = {};
      if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};
      if (!valueStore[rowStr]) valueStore[rowStr] = {};
      if (!valueStore[rowStr][colStr]) valueStore[rowStr][colStr] = {};
  
      valFields.forEach(valField => {
        const value = parseFloat(row[valField]) || 0;
  
        if (aggregateFunc === 'count') {
          pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + 1;
        } else {
          pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + value;
  
          if (aggregateFunc === 'avg') {
            if (!valueStore[rowStr][colStr][valField]) {
              valueStore[rowStr][colStr][valField] = [];
            }
            valueStore[rowStr][colStr][valField].push(value);
          }
        }
      });
    });
  
    if (aggregateFunc === 'avg') {
      for (const rKey in valueStore) {
        for (const cKey in valueStore[rKey]) {
          for (const val of valFields) {
            const values = valueStore[rKey][cKey][val] || [];
            const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            pivot[rKey][cKey][val] = avg;
          }
        }
      }
    }
    console.log(pivot)
    console.log(rowKeys)
    console.log(colKeys)
    return { pivot, rowKeys, colKeys };
  };