import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { TableBody, TableCell, TableRow, Table, TableSelectionCell, useTableFeatures, useTableSelection, TableCellLayout, createTableColumn, } from "@fluentui/react-components";
export const DisputesSingleSelectTable = ({ items, selectedDispute, onSelectionChange, }) => {
    const columns = React.useMemo(() => [
        createTableColumn({
            columnId: "DPPID",
            renderHeaderCell: () => (_jsx(TableCellLayout, { style: { width: 260, minWidth: 260, maxWidth: 260 } })),
            renderCell: (item) => (_jsx(TableCellLayout, { style: { width: 260, minWidth: 260, maxWidth: 260 }, children: item?.DPPID })),
        }),
    ], []);
    const { getRows, selection: { toggleRow, isRowSelected }, } = useTableFeatures({
        columns,
        items,
    }, [
        useTableSelection({
            selectionMode: "single",
            defaultSelectedItems: selectedDispute
                ? new Set([selectedDispute.DPPID])
                : new Set(),
        }),
    ]);
    const rows = getRows((row) => {
        const selected = isRowSelected(row.item.DPPID);
        return {
            ...row,
            onClick: (e) => {
                toggleRow(e, row.item.DPPID);
                const picked = items.find((it) => it.DPPID === row.item.DPPID);
                onSelectionChange?.(picked);
            },
            onKeyDown: (e) => {
                if (e.key === " ") {
                    e.preventDefault();
                    toggleRow(e, row.item.DPPID);
                    const picked = items.find((it) => it.DPPID.toString() === row.item.DPPID.toString());
                    onSelectionChange?.(picked);
                }
            },
            selected,
            appearance: selected ? "brand" : "none",
        };
    });
    return (_jsx(Table, { size: "extra-small", "aria-label": "Table with single selection", style: { minWidth: "90px" }, children: _jsx(TableBody, { children: rows.map(({ item, selected, onClick, onKeyDown, appearance }) => (_jsxs(TableRow, { onClick: onClick, onKeyDown: onKeyDown, "aria-selected": selected, appearance: appearance, children: [_jsx(TableSelectionCell, { checked: selected, type: "radio", radioIndicator: { "aria-label": "Select row" } }), _jsx(TableCell, { children: _jsx(TableCellLayout, { style: { width: 260, minWidth: 260, maxWidth: 260 }, children: _jsxs("div", { style: { display: "flex", gap: "10px" }, children: [_jsx("div", { children: item.DPPID }), _jsxs("div", { children: [item.DTHDES, " "] })] }) }) })] }, item.DPPID))) }) }));
};
