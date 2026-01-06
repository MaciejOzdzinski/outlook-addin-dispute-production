import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { SearchBox, List as FluentList, ListItem, makeStyles, tokens, Persona, mergeClasses, Spinner, } from "@fluentui/react-components";
import { List as VirtualList } from "react-window";
const ITEM_HEIGHT = 46; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna
// funkcja podświetlająca fragmenty tekstu pasujące do zapytania
function highlightMatch(primaryText, deferredSearch) {
    const text = String(primaryText ?? "");
    const q = String(deferredSearch ?? "").trim();
    if (!q)
        return text;
    // Escape regex special chars and split keeping matches (case-insensitive)
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    const qLower = q.toLowerCase();
    return parts.map((part, i) => part.toLowerCase() === qLower ? (_jsx("span", { style: {
            backgroundColor: tokens.colorSubtleBackgroundSelected,
            fontWeight: tokens.fontWeightSemibold,
            padding: "0 2px",
            borderRadius: tokens.borderRadiusSmall,
        }, children: part }, i)) : (_jsx("span", { children: part }, i)));
}
const useStyles = makeStyles({
    listRoot: {
        height: "360px",
        overflowX: "hidden", // lista jako całość nie scrolluje w poziomie
    },
    rowBase: {
        boxSizing: "border-box", // padding mieści się w width od react-window
        width: "100%", // dopasuj do viewportu listy
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
        paddingBlock: tokens.spacingVerticalS,
        paddingInline: tokens.spacingHorizontalM,
        cursor: "pointer",
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: "transparent",
        ":hover": {
            backgroundColor: tokens.colorSubtleBackgroundHover,
        },
    },
    rowSelected: {
        backgroundColor: tokens.colorSubtleBackgroundSelected,
        ":hover": {
            backgroundColor: tokens.colorSubtleBackgroundSelected,
        },
    },
    avatarWrapper: {
        flexShrink: 0,
    },
    textContainer: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // ważne
        minWidth: 0, // pozwala flexowi ścisnąć tekst do szerokości listy
    },
    titleLine: {
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden", // ellipsis zamiast poziomego scrolla
        fontWeight: tokens.fontWeightSemibold,
    },
    subtitle: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    spinnerContainer: {
        display: "flex",
        justifyContent: "flex-end",
        marginBlock: tokens.spacingVerticalXS,
    },
});
export const CustomerSearchList = ({ customers, selectedCustomer, onSelectedChange, }) => {
    const [search, setSearch] = React.useState("");
    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);
    // wynik filtrowania trzymamy w stanie
    const [filtered, setFiltered] = React.useState(customers);
    // 🚦 transition – pokażemy spinner kiedy filtrowanie trwa
    const [isPending, startTransition] = React.useTransition();
    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
        startTransition(() => {
            const q = deferredSearch.trim();
            if (!q) {
                setFiltered(customers);
                return;
            }
            const s = q.toLowerCase();
            setFiltered(customers.filter((c) => c.NANUM.toLowerCase().includes(s) ||
                c.NANAME.toLowerCase().includes(s)));
        });
    }, [customers, deferredSearch]);
    const styles = useStyles();
    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    const Row = ({ index, style }) => {
        const customer = filtered[index];
        const isSelected = customer.NANUM === selectedCustomer?.NANUM;
        const rowClassName = mergeClasses(styles.rowBase, isSelected && styles.rowSelected);
        return (_jsx(ListItem, { style: { ...style, width: "100%" }, "aria-setsize": filtered.length, "aria-posinset": index + 1, className: rowClassName, onClick: () => onSelectedChange(customer), children: _jsx(_Fragment, { children: _jsx(Persona, { name: customer.NANAME, secondaryText: customer.NANUM, avatar: { color: "colorful", "aria-hidden": true } }) }) }, customer.NANUM));
    };
    return (_jsxs(_Fragment, { children: [_jsx(SearchBox, { size: "small", value: search, onChange: (_, data) => setSearch(data.value) }), isPending && (_jsx("div", { className: styles.spinnerContainer, children: _jsx(Spinner, { size: "tiny", label: "Filtering\u2026" }) })), _jsx(FluentList, { tabIndex: 0, style: { width: "100%" }, "aria-label": "Customer search results", children: _jsx(VirtualList, { rowComponent: Row, rowCount: filtered.length, rowHeight: 48, rowProps: { customers: filtered }, style: {
                        height: Math.min(LIST_HEIGHT, filtered.length * ITEM_HEIGHT) + 10,
                        width: "100%",
                    } }) })] }));
};
