export const formatHeader = str =>
  str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const getUniqueKeys = (data, fields) => {
  const map = new Map();
  data.forEach(row => {
    const key = fields.map(f => row[f] ?? 'Total');
    const keyStr = key.join('|');
    map.set(keyStr, key);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.join('|').localeCompare(b.join('|'))
  );
};

export const buildPivotData = (rawData, rowFields, colFields, valFields, aggregateFuncs = {}) => {
  const rowKeys = rowFields.length ? getUniqueKeys(rawData, rowFields) : [['Total']];
  const colKeys = colFields.length ? getUniqueKeys(rawData, colFields) : [['Total']];

  const pivot = {};
  const avgStore = {}; 

  rawData.forEach(row => {
    const rowKey = rowFields.length ? rowFields.map(f => row[f] ?? 'Total') : ['Total'];
    const colKey = colFields.length ? colFields.map(f => row[f] ?? 'Total') : ['Total'];

    const rowStr = rowKey.join('|');
    const colStr = colKey.join('|');

    if (!pivot[rowStr]) pivot[rowStr] = {};
    if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};

    valFields.forEach(valField => {
      const aggFunc = aggregateFuncs[valField] || 'sum';
      const rawVal = row[valField];
      const value = parseFloat(rawVal);
      const isValid = !isNaN(value);
      if (aggFunc === 'avg') {
        if (!avgStore[rowStr]) avgStore[rowStr] = {};
        if (!avgStore[rowStr][colStr]) avgStore[rowStr][colStr] = {};
        if (!avgStore[rowStr][colStr][valField]) avgStore[rowStr][colStr][valField] = [];

        if (isValid) {
          avgStore[rowStr][colStr][valField].push(value);
        }
      } else if (aggFunc === 'sum') {
        pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + (isValid ? value : 0);
      } else if (aggFunc === 'count') {
        pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + 1;
      }
    });
  });

  // Now compute average from avgStore
  for (const rowStr in avgStore) {
    for (const colStr in avgStore[rowStr]) {
      for (const valField in avgStore[rowStr][colStr]) {
        const values = avgStore[rowStr][colStr][valField];
        const sum = values.reduce((acc, v) => acc + v, 0);
        const avg = values.length > 0 ? sum / values.length : 0;

        if (!pivot[rowStr]) pivot[rowStr] = {};
        if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};
        pivot[rowStr][colStr][valField] = avg;
      }
    }
  }

  return { pivot, rowKeys, colKeys };
};