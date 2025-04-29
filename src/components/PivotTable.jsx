import React from 'react';
import '../styles/styles.css';
import { buildPivotData, formatHeader } from '../pivotLogic';

const PivotTable = ({ rawData, rowFields, colFields, valFields, aggregateFuncs }) => {
  const { pivot, rowKeys, colKeys } = buildPivotData(rawData, rowFields, colFields, valFields, aggregateFuncs);
  const getKeyStr = (arr) => arr.map(k => k ?? 'Total').join('|');

  const groupByLevel = (keys, level) => keys.reduce((res, key) => {
    const val = key[level] ?? 'Total';
    (res[val] = res[val] || []).push(key);
    return res;
  }, {});

  const countLeafCols = (group, level) =>
    level >= colFields.length ? 1 :
      Object.values(groupByLevel(group, level)).reduce((sum, g) => sum + countLeafCols(g, level + 1), 0);

  const countLeafRows = (group, level) =>
    level >= rowFields.length ? group.length :
      Object.values(groupByLevel(group, level)).reduce((sum, g) => sum + countLeafRows(g, level + 1), 0);

  const formatNumber = (num) => num == null ? '' : Number.isInteger(num) ? num : num.toFixed(2);

  const aggregateCellValues = (valField, values) => {
    if (!values.length) return null;
    const func = aggregateFuncs[valField];
    if (func === 'sum' || func === 'count') return values.reduce((a, b) => a + (b || 0), 0);
    if (func === 'avg') return values.reduce((a, b) => a + b, 0) / values.length;
    if (func === 'min') return Math.min(...values);
    if (func === 'max') return Math.max(...values);
    return null;
  };

  const calculateRowTotal = (rowKeyStr, valField) =>
    aggregateCellValues(valField,
      colKeys.map(colKey => pivot[rowKeyStr]?.[getKeyStr(colKey)]?.[valField]).filter(v => v != null && !isNaN(v))
    );

  const calculateColumnTotal = (colStr, valField) =>
    aggregateCellValues(valField,
      rowKeys.map(rowKey => pivot[getKeyStr(rowKey)]?.[colStr]?.[valField]).filter(v => v != null && !isNaN(v))
    );

  const calculateGrandTotal = (valField) =>
    aggregateCellValues(valField,
      colKeys.flatMap(colKey =>
        rowKeys.map(rowKey =>
          pivot[getKeyStr(rowKey)]?.[getKeyStr(colKey)]?.[valField]
        ).filter(v => v != null && !isNaN(v))
      )
    );

  const renderColHeaders = () => {
    const levels = colFields.length || 1;
    const headerRows = Array(levels + 1).fill().map(() => []);
    const buildHeaderMatrix = (keys, level = 0) => {
      const grouped = groupByLevel(keys, level);
      for (const val in grouped) {
        const group = grouped[val];
        headerRows[level].push({ value: val, span: countLeafCols(group, level + 1) * valFields.length });
        if (level + 1 < levels) buildHeaderMatrix(group, level + 1);
      }
    };
    buildHeaderMatrix(colKeys);

    headerRows[levels] = colKeys.flatMap(() =>
      valFields.map(val => ({ value: `${formatHeader(val)} (${aggregateFuncs[val]})` }))
    );

    if (colFields.length > 0) {
      headerRows.forEach((row, i) => {
        const cells = i < levels
          ? [{ value: i === 0 ? "Total" : "", span: valFields.length, isTotal: true }]
          : valFields.map(val => ({ value: `${formatHeader(val)} (${aggregateFuncs[val]})`, isTotal: true }));
        row.push(...cells);
      });
    }

    return (
      <thead>
        {headerRows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {rowIndex === 0 && rowFields.map((field, j) => (
              <th key={j} rowSpan={headerRows.length} className="field-header">{formatHeader(field)}</th>
            ))}
            {row.map((cell, i) => (
              <th key={i} colSpan={cell.span || 1} className={cell.isTotal ? "total-header" : ""}>
                {cell.value}
              </th>
            ))}
          </tr>
        ))}
      </thead>
    );
  };

  const buildRows = (keys, level = 0) => {
    const grouped = groupByLevel(keys, level);
    const rows = [];

    for (const key in grouped) {
      const group = grouped[key];
      const rowspan = countLeafRows(group, level + 1);

      if (level < rowFields.length - 1) {
        buildRows(group, level + 1).forEach((childRow, idx) => {
          if (idx === 0) childRow.unshift(<td key={`${level}-${key}`} rowSpan={rowspan} className="row-header">{key}</td>);
          rows.push(childRow);
        });
      } else {
        const rowKeyStr = getKeyStr(group[0]);
        const dataRow = [];

        colKeys.forEach(colKey => {
          const colKeyStr = getKeyStr(colKey);
          valFields.forEach(val => {
            const valNum = pivot[rowKeyStr]?.[colKeyStr]?.[val];
            dataRow.push(<td key={`${rowKeyStr}-${colKeyStr}-${val}`}>{valNum != null ? formatNumber(valNum) : ''}</td>);
          });
        });

        if (colFields.length > 0) {
          valFields.forEach(val => {
            const total = calculateRowTotal(rowKeyStr, val);
            dataRow.push(<td key={`${rowKeyStr}-total-${val}`} className="row-total">{total != null ? formatNumber(total) : ''}</td>);
          });
        }

        rows.push([<td key={`${level}-${key}`} className="row-header">{key}</td>, ...dataRow]);
      }
    }

    return rows;
  };

  const renderBody = () => {
    let structuredRows = rowFields.length ? buildRows(rowKeys) : [[
      ...colKeys.flatMap(colKey =>
        valFields.map(val => {
          const total = calculateColumnTotal(getKeyStr(colKey), val);
          return <td key={`val-${colKey}-${val}`}>{total != null ? formatNumber(total) : ''}</td>;
        })
      ),
      ...(colFields.length ? valFields.map(val => {
        const gt = calculateGrandTotal(val);
        return <td key={`grand-${val}`} className="grand-total">{gt != null ? formatNumber(gt) : ''}</td>;
      }) : [])
    ]];

    const totalRow = () => (
      <tr className="total-row">
        {rowFields.length > 0 && <td colSpan={rowFields.length} className="total-label"><strong>Total</strong></td>}
        {colKeys.flatMap(colKey =>
          valFields.map(val => {
            const value = calculateColumnTotal(getKeyStr(colKey), val);
            return <td key={`total-${colKey}-${val}`} className="column-total"><strong>{formatNumber(value)}</strong></td>;
          })
        )}
        {colFields.length > 0 && valFields.map(val => {
          const gt = calculateGrandTotal(val);
          return <td key={`grand-${val}`} className="grand-total"><strong>{formatNumber(gt)}</strong></td>;
        })}
      </tr>
    );

    return (
      <tbody>
        {structuredRows.map((cells, i) => <tr key={i}>{cells}</tr>)}
        {totalRow()}
      </tbody>
    );
  };

  return (
    <div>
      {(valFields.length || rowFields.length || colFields.length) ? (
        <div>
          <h2>Pivot Table</h2>
          <div className='pivot-table-container'>
          <table className="pivot-table">
            {renderColHeaders()}
            {renderBody()}
          </table>
        </div>
          </div>
      ) : rawData.length > 0 ? (
        <div className="empty-state">
          <h2>Pivot Table</h2>
          <p>To build a report, choose fields from the PivotTable Fields List</p>
        </div>
      ) : null}
    </div>
  );
};

export default PivotTable;
