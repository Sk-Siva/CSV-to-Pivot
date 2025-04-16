import React from 'react';
import '../styles/styles.css';
import { buildPivotData, formatHeader } from '../pivotLogic';

const PivotTable = ({ rawData, rowFields, colFields, valFields, aggregateFunc }) => {
  const { pivot, rowKeys, colKeys } = buildPivotData(rawData, rowFields, colFields, valFields, aggregateFunc);

  const getKeyStr = (arr) => arr.map(k => k ?? 'Total').join('|');

  const groupByLevel = (keys, level) => {
    return keys.reduce((acc, key) => {
      const val = key[level] ?? 'Total';
      acc[val] = acc[val] || [];
      acc[val].push(key);
      return acc;
    }, {});
  };

  const countLeafCols = (group, level) => {
    if (level >= colFields.length) return 1;
    const grouped = groupByLevel(group, level);
    return Object.values(grouped).reduce((sum, g) => sum + countLeafCols(g, level + 1), 0);
  };

  const renderColHeaders = () => {
    const levels = colFields.length || 1;
    const headerRows = Array.from({ length: levels + 1 }, () => []);
    const buildHeaderMatrix = (keys, level = 0) => {
      const grouped = groupByLevel(keys, level);
      const row = [];

      for (const val in grouped) {
        const group = grouped[val];
        const span = countLeafCols(group, level + 1) * valFields.length;
        row.push({ value: val, span });

        if (level + 1 < levels) {
          buildHeaderMatrix(group, level + 1);
        }
      }

      headerRows[level].push(...row);
    };

    buildHeaderMatrix(colKeys);

    // Value headers
    headerRows[levels] = colKeys.flatMap(() =>
      valFields.map(val => ({ value: formatHeader(val) }))
    );

    return (
      <thead>
        {headerRows.map((row, rowIndex) => (
          <tr key={`col-header-${rowIndex}`}>
            {rowIndex === 0 &&
              (rowFields.length ? rowFields : ['']).map((field, j) => (
                <th key={`rhead-${j}`} rowSpan={headerRows.length}>
                  {formatHeader(field)}
                </th>
              ))}
            {row.map((cell, i) => (
              <th key={`c-${rowIndex}-${i}`} colSpan={cell.span || 1}>
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
              <td rowSpan={rowspan} key={`${level}-${key}`}>{key}</td>
            );
          }
          rows.push(childRow);
        });
      } else {
        const rowKeyArr = group[0];
        const rowKeyStr = getKeyStr(rowKeyArr);
        const dataRow = [];

        colKeys.forEach(colKey => {
          const colKeyStr = getKeyStr(colKey);
          valFields.forEach(val => {
            const valNum = pivot[rowKeyStr]?.[colKeyStr]?.[val] ?? 0;
            dataRow.push(
              <td key={`${rowKeyStr}-${colKeyStr}-${val}`}>{valNum}</td>
            );
          });
        });

        const label = rowFields.length ? key : 'Total';
        rows.push([<td key={`${level}-${key}`}>{label}</td>, ...dataRow]);
      }
    }

    return rows;
  };

  const renderBody = () => {
    const structuredRows = buildRows(rowKeys);

    const totalRow = () => {
      const totalCells = [];

      colKeys.forEach(colKey => {
        const colStr = getKeyStr(colKey);
        valFields.forEach(val => {
          let total = 0;
          rowKeys.forEach(rowKey => {
            const rowStr = getKeyStr(rowKey);
            total += pivot[rowStr]?.[colStr]?.[val] || 0;
          });
          totalCells.push(
            <td key={`total-${colStr}-${val}`}><strong>{total}</strong></td>
          );
        });
      });

      return (
        <tr>
          <td colSpan={rowFields.length}><strong>Total</strong></td>
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

  if (!valFields.length) return <p>Please select at least one value field.</p>;

  return (
    <div>
      <h2>Pivot Table</h2>
      <table className="pivot-table">
        {renderColHeaders()}
        {renderBody()}
      </table>
    </div>
  );
};

export default PivotTable;