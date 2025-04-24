import React from 'react';
import '../styles/styles.css';
import { buildPivotData, formatHeader } from '../pivotLogic';

const PivotTable = ({ rawData, rowFields, colFields, valFields, aggregateFuncs }) => {
  const { pivot, rowKeys, colKeys } = buildPivotData(rawData, rowFields, colFields, valFields, aggregateFuncs);
  const getKeyStr = (arr) => arr.map(k => k ?? 'Total').join('|');

  const groupByLevel = (keys, level) => {
    const result = {};
    for (const key of keys) {
      const val = key[level] ?? 'Total';
      result[val] = result[val] || [];
      result[val].push(key);
    }
    return result;
  };

  const countLeafCols = (group, level) => {
    if (level >= colFields.length) return 1;
    const grouped = groupByLevel(group, level);
    return Object.values(grouped).reduce((sum, g) => sum + countLeafCols(g, level + 1), 0);
  };

  const formatNumber = (num) => {
    if (num == null) return '';
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  const renderColHeaders = () => {
    const levels = colFields.length || 1;
    const headerRows = Array(levels + 1).fill().map(() => []);

    const buildHeaderMatrix = (keys, level = 0) => {
      const grouped = groupByLevel(keys, level);

      for (const val in grouped) {
        const group = grouped[val];
        const span = countLeafCols(group, level + 1) * valFields.length;
        headerRows[level].push({ value: val, span });

        if (level + 1 < levels) {
          buildHeaderMatrix(group, level + 1);
        }
      }
    };

    buildHeaderMatrix(colKeys);

    // Add column headers for each value field
    headerRows[levels] = colKeys.flatMap(() =>
      valFields.map(val => ({
        value: `${formatHeader(val)} (${aggregateFuncs[val]})`
      }))
    );

    // Add Total column header
    if (colKeys.length > 0) {
      headerRows[0].push({ value: "Total", span: valFields.length, isTotal: true });

      // Fill middle level headers for Total column if needed
      for (let i = 1; i < levels; i++) {
        headerRows[i].push({ value: "", span: valFields.length, isTotal: true });
      }

      // Add value fields for Total column
      headerRows[levels].push(...valFields.map(val => ({
        value: `${formatHeader(val)} (${aggregateFuncs[val]})`,
        isTotal: true
      })));
    }

    return (
      <thead>
        {headerRows.map((row, rowIndex) => (
          <tr key={`col-header-${rowIndex}`}>
            {rowIndex === 0 && rowFields.length > 0 &&
              rowFields.map((field, j) => (
                <th key={`rhead-${j}`} rowSpan={headerRows.length} className="field-header">
                  {formatHeader(field)}
                </th>
              ))}
            {row.map((cell, i) => (
              <th
                key={`c-${rowIndex}-${i}`}
                colSpan={cell.span || 1}
                className={cell.isTotal ? "total-header" : ""}
              >
                {cell.value}
              </th>
            ))}
          </tr>
        ))}
      </thead>
    );
  };

  const countLeafRows = (group, level) => {
    if (level >= rowFields.length) return group.length;
    const grouped = groupByLevel(group, level);
    return Object.values(grouped).reduce((sum, g) => sum + countLeafRows(g, level + 1), 0);
  };

  const aggregateCellValues = (valField, values) => {
    if (!values.length) return null;

    const func = aggregateFuncs[valField];
    if (func === 'sum' || func === 'count') {
      return values.reduce((sum, val) => sum + (val || 0), 0);
    }
    if (func === 'avg') {
      const sum = values.reduce((acc, val) => acc + val, 0);
      return sum / values.length;
    }
    if (func === 'min') {
      return Math.min(...values);
    }
    if (func === 'max') {
      return Math.max(...values);
    }
    return null;
  };

  const calculateRowTotal = (rowKeyStr, valField) => {
    const values = [];

    for (const colKey of colKeys) {
      const colKeyStr = getKeyStr(colKey);
      const cellValue = pivot[rowKeyStr]?.[colKeyStr]?.[valField];

      if (cellValue != null && !isNaN(cellValue)) {
        values.push(cellValue);
      }
    }

    return aggregateCellValues(valField, values);
  };

  const buildRows = (keys, level = 0) => {
    const grouped = groupByLevel(keys, level);
    const rows = [];

    for (const key in grouped) {
      const group = grouped[key];
      const rowspan = countLeafRows(group, level + 1);

      if (level < rowFields.length - 1) {
        const children = buildRows(group, level + 1);
        children.forEach((childRow, idx) => {
          if (idx === 0) {
            childRow.unshift(
              <td rowSpan={rowspan} key={`${level}-${key}`} className="row-header">
                {key}
              </td>
            );
          }
          rows.push(childRow);
        });
      } else {
        const rowKeyArr = group[0];
        const rowKeyStr = getKeyStr(rowKeyArr);
        const dataRow = [];

        // Add cells for each column and value field
        colKeys.forEach(colKey => {
          const colKeyStr = getKeyStr(colKey);
          valFields.forEach(val => {
            const valNum = pivot[rowKeyStr]?.[colKeyStr]?.[val];
            dataRow.push(
              <td key={`${rowKeyStr}-${colKeyStr}-${val}`}>
                {valNum != null ? formatNumber(valNum) : ''}
              </td>
            );
          });
        });

        // Add total cells for this row
        valFields.forEach(val => {
          const totalValue = calculateRowTotal(rowKeyStr, val);
          dataRow.push(
            <td key={`${rowKeyStr}-total-${val}`} className="row-total">
              {totalValue != null ? formatNumber(totalValue) : ''}
            </td>
          );
        });

        const label = rowFields.length ? key : null;
        const rowCells = rowFields.length ? [
          <td key={`${level}-${key}`} className="row-header">{label}</td>
        ] : [];
        rows.push([...rowCells, ...dataRow]);
      }
    }

    return rows;
  };

  const calculateColumnTotal = (colStr, valField) => {
    const values = [];

    for (const rowKey of rowKeys) {
      const rowStr = getKeyStr(rowKey);
      const cellValue = pivot[rowStr]?.[colStr]?.[valField];

      if (cellValue != null && !isNaN(cellValue)) {
        values.push(cellValue);
      }
    }

    return aggregateCellValues(valField, values);
  };

  const calculateGrandTotal = (valField) => {
    const values = [];

    for (const colKey of colKeys) {
      const colStr = getKeyStr(colKey);
      for (const rowKey of rowKeys) {
        const rowStr = getKeyStr(rowKey);
        const cellValue = pivot[rowStr]?.[colStr]?.[valField];

        if (cellValue != null && !isNaN(cellValue)) {
          values.push(cellValue);
        }
      }
    }

    return aggregateCellValues(valField, values);
  };

  const renderBody = () => {
    let structuredRows;

    if (rowFields.length === 0) {
      const dataRow = [];

      colKeys.forEach(colKey => {
        const colStr = getKeyStr(colKey);
        valFields.forEach(val => {
          const finalValue = calculateColumnTotal(colStr, val);
          dataRow.push(
            <td key={`val-${colStr}-${val}`}>
              {finalValue != null ? formatNumber(finalValue) : ''}
            </td>
          );
        });
      });

      valFields.forEach(val => {
        const grandTotal = calculateGrandTotal(val);
        dataRow.push(
          <td key={`grand-total-${val}`} className="grand-total">
            {grandTotal != null ? formatNumber(grandTotal) : ''}
          </td>
        );
      });

      structuredRows = [[...dataRow]];
    } else {
      structuredRows = buildRows(rowKeys);
    }


    const totalRow = () => {
      const totalCells = [];

      colKeys.forEach(colKey => {
        const colStr = getKeyStr(colKey);
        valFields.forEach(val => {
          const finalValue = calculateColumnTotal(colStr, val);
          totalCells.push(
            <td key={`total-${colStr}-${val}`} className="column-total">
              <strong>{finalValue != null ? formatNumber(finalValue) : ''}</strong>
            </td>
          );
        });
      });

      valFields.forEach(val => {
        const grandTotal = calculateGrandTotal(val);
        totalCells.push(
          <td key={`grand-total-${val}`} className="grand-total">
            <strong>{grandTotal != null ? formatNumber(grandTotal) : ''}</strong>
          </td>
        );
      });

      return (
        <tr className="total-row">
          {rowFields.length > 0 && (
            <td colSpan={rowFields.length} className="total-label">
              <strong>Total</strong>
            </td>
          )}
          {totalCells}
        </tr>
      );
    };

    return (
      <tbody>
        {structuredRows.map((cells, i) => (
          <tr key={i}>{cells}</tr>
        ))}
        {totalRow()}
      </tbody>
    );
  };

  return (
    <div>
      {(valFields.length > 0 || rowFields.length > 0 || colFields.length > 0) ? (
        <div className='pivot-table-container'>
          <table className="pivot-table">
            {renderColHeaders()}
            {renderBody()}
          </table>
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