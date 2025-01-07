import React, {useState, useEffect} from 'react';
import {DataFields} from '../models/DataFields'

export function FormatTable({dataFields, initialRowsState, onChange}) {
    const [rows, setRows] = useState(initialRowsState);

    useEffect(() => {
        onChange(rows);
    }, [rows]);

    const addRowBottom = () =>
        setRows((prevRows) => [...prevRows, new Array(prevRows[0].length).fill([DataFields.Empty])]);

    const removeRowBottom = () =>
        setRows((prevRows) =>
            prevRows.length > 1 ? prevRows.slice(0, -1) : prevRows
        );

    const addColumnRight = () =>
        setRows((prevRows) =>
            prevRows.map((row) => [...row, [DataFields.Empty]])
        );

    const removeColumnRight = () =>
        setRows((prevRows) =>
            prevRows[0].length > 1
                ? prevRows.map((row) => row.slice(0, -1))
                : prevRows
        );

    const handleSelectedItemsChange = (rowIndex, cellIndex, selectedItems) => {
        const updatedRows = [...rows];
        let filteredItems = selectedItems;
        if (selectedItems.length > 1) {
            filteredItems = selectedItems.filter((item) => !(item[0] === "" && item[1] === ""));
        }
        updatedRows[rowIndex][cellIndex] = selectedItems;
        setRows(updatedRows);
    };

    return (
        <div className="container d-flex flex-column mb-5">
            <div className="d-flex align-items-center">
                <div className="position-relative">
                    <div className="table-responsive" style={{maxWidth: "950px", overflowX: "auto"}}>
                        <table className="table table-bordered text-center m-0">
                            <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex}>
                                            <Cell items={[DataFields.Delete, ...dataFields]}
                                                  initialSelecteditems={cell}
                                                  onChange={(selectedItems) => handleSelectedItemsChange(rowIndex, cellIndex, selectedItems)}/>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div
                        className="d-flex justify-content-center position-absolute"
                        style={{
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <button className="btn btn-link btn-sm" onClick={addRowBottom}>
                            <i className="bi bi-plus-square-fill fs-3"></i>
                        </button>
                        <button className="btn btn-link btn-sm" onClick={removeRowBottom}>
                            <i className="bi bi-dash-square-fill fs-3" style={{color: '#dc3545'}}></i>
                        </button>
                    </div>
                </div>

                <div className="d-flex flex-row align-items-center justify-content-center">
                    <button className="btn btn-link btn-sm" onClick={addColumnRight}>
                        <i className="bi bi-plus-square-fill fs-3"></i>
                    </button>
                    <button className="btn btn-link btn-sm" onClick={removeColumnRight}>
                        <i className="bi bi-dash-square-fill fs-3" style={{color: '#dc3545'}}></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

const Cell = ({items, initialSelecteditems, onChange}) => {
    const [selectedItems, setSelectedItems] = useState(initialSelecteditems.filter((item) =>
        !(item[0] === "" && item[1] === "")));

    useEffect(() => {
        if (selectedItems.length === 0) {
            onChange([DataFields.Empty])
        } else {
            onChange(selectedItems);
        }
    }, [selectedItems]);

    const addItem = (newItem) => {
        setSelectedItems((prevItems) => [...prevItems, newItem]);
    }

    const replaceItem = (index, newItem) => {
        setSelectedItems((prevItems) => {
            if (newItem[0] === DataFields.Delete[0]) {
                return prevItems.filter((_, itemIndex) => itemIndex !== index);
            } else {
                const updatedItems = [...prevItems];
                updatedItems[index] = newItem;
                return updatedItems;
            }
        });
    };

    const availableItems = items.filter((item) =>
        !selectedItems.some((selectedItem) => JSON.stringify(selectedItem) === JSON.stringify(item)));

    return (
        <div className="d-flex flex-row align-items-center w-auto">
            {selectedItems.map((item, index) => (
                <div key={index}>
                    <button
                        className="btn btn-outline-primary h-auto me-1"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        {item[0]}
                    </button>

                    <ul className="dropdown-menu">
                        {availableItems.map((newItem, newIndex) => (
                            <li key={newIndex}>
                                <button
                                    className="dropdown-item"
                                    onClick={() => replaceItem(index, newItem)}
                                >
                                    {newItem[0]}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}

            <button
                className="btn btn-link btn-sm h-100"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i className="bi bi-plus-circle fs-4"></i>
            </button>

            <div className="dropdown-menu">
                {availableItems.filter((item) => item !== items[0]).map((item, index) => (
                    <button
                        key={index}
                        className="dropdown-item"
                        onClick={() => addItem(item)}
                    >
                        {item[0]}
                    </button>
                ))}
            </div>
        </div>
    );
}