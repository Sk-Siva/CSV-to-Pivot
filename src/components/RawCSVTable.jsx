import React from 'react';
import "../styles/styles.css";

const RawCSVTable = ({ data }) => {
    if (!data || data.length === 0) return <div>No data to display.</div>;
    const headers = Object.keys(data[0]);
    return (
        <div className="raw-table-container">
            <table className="raw-table">
                <thead>
                    <tr>
                        {headers.map((header, i) => (
                            <th key={i}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header, colIndex) => (
                                <td key={colIndex}>{row[header]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RawCSVTable;