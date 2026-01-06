import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Combobox, Field, InfoLabel, makeStyles, Option, Skeleton, SkeletonItem, tokens, useId, } from "@fluentui/react-components";
import { List as VirtualList } from "react-window";
import { startTransition } from "react";
import { DocumentText20Regular } from "@fluentui/react-icons";
const ITEM_HEIGHT = 42; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna
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
// Komponent CustomerCombobox z Fluent UI Combobox i react-window i memoizacją
export const InvoicesComboBox = React.memo(({ invoices, selectedInvoice, onSelectedChange, isLoading = false, error, }) => {
    const comboId = useId();
    const selectedOptionValue = selectedInvoice
        ? selectedInvoice.DTREFX.toString()
        : undefined;
    const styles = useStyles();
    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [search, setSearch] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);
    // wynik filtrowania trzymamy w stanie
    const [filteredInvoices, setFilteredInvoices] = React.useState(invoices);
    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
        startTransition(() => {
            const q = deferredSearch.trim();
            if (!q) {
                setFilteredInvoices(invoices);
                return;
            }
            const s = q.toLowerCase();
            console.log("Filtering invoices with query:", s);
            setFilteredInvoices(invoices.filter((c) => c.DTDOTY.toLowerCase().includes(s) ||
                c.DTIDNO.toString().toLowerCase().includes(s)));
        });
    }, [invoices, deferredSearch]);
    React.useEffect(() => {
        if (isTyping)
            return;
        if (!selectedInvoice) {
            setSearch("");
            return;
        }
        setSearch(`${selectedInvoice?.DTDOTY}  ${selectedInvoice?.DTIDNO}`);
    }, [selectedInvoice, isTyping]);
    const onOptionSelect = (_, data) => {
        const id = data.optionValue ? Number(data.optionValue) : null;
        const findInvoice = filteredInvoices.find((c) => c.DTREFX === id) || null;
        onSelectedChange(findInvoice);
        if (id == null || !findInvoice) {
            setIsTyping(false);
            setSearch("");
            return;
        }
        setIsTyping(false);
        setSearch(`${findInvoice?.DTDOTY}  ${findInvoice?.DTIDNO}`);
    };
    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    const Row = ({ index, style }) => {
        const invoice = filteredInvoices[index];
        return (_jsx("div", { style: style, children: _jsx(Option, { className: styles.rowBase, value: invoice.DTREFX.toString(), text: `${invoice.DTDOTY}  ${invoice.DTIDNO}`, children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [(invoice?.DLPIDS ?? []).length > 0 && _jsx(DocumentText20Regular, {}), (invoice?.DLPIDS ?? []).length === 0 && (_jsx("div", { style: { width: "20px" } })), _jsxs("div", { style: {
                                display: "flex",
                                flexDirection: "column",
                                fontSize: "small",
                                boxSizing: "border-box", // padding mieści się w width od react-window
                            }, children: [_jsx("div", { children: `${invoice.DTDOTY} ${invoice.DTIDNO}` }), _jsx("div", { style: { fontSize: "10px", marginTop: "-3px", color: "gray" }, children: invoice.DTTTXT })] })] }) }, invoice.DTREFX) }));
    };
    return (_jsx(_Fragment, { children: _jsx(Field, { size: "small", label: _jsx(InfoLabel, { info: "Example info", size: "small", children: "Invoice Number" }), required: true, validationState: error ? "error" : "none", validationMessage: error || "", children: isLoading ? (_jsx(Skeleton, { "aria-label": "Loading Content", children: _jsx(SkeletonItem, { shape: "rectangle", size: 24 }) })) : (_jsx(Combobox, { tabIndex: 0, clearable: true, size: "small", "aria-labelledby": comboId, placeholder: "Enter invoice", 
                // to, co jest w polu input
                value: search, 
                // pisanie w input -> zmiana query + czyszczenie wyboru
                onChange: (ev) => {
                    setIsTyping(true);
                    // użytkownik coś pisze → aktualizujemy query
                    setSearch(ev.target.value);
                    // wpisywanie ręczne kasuje aktualny wybór
                    onSelectedChange(null);
                }, onOptionSelect: onOptionSelect, onOpenChange: (_, data) => {
                    if (data.open) {
                        // chcemy znowu zobaczyć wszystkie faktury
                        setFilteredInvoices(invoices);
                        setIsTyping(false);
                    }
                }, selectedOptions: selectedOptionValue ? [selectedOptionValue] : [], style: { minWidth: "unset", width: "100%", maxWidth: "100%" }, input: { style: { width: "100%" } }, children: _jsx(VirtualList, { className: styles.listRoot, rowComponent: Row, rowCount: filteredInvoices.length, rowHeight: ITEM_HEIGHT, rowProps: { invoices: filteredInvoices }, style: {
                        height: Math.min(LIST_HEIGHT, filteredInvoices.length * ITEM_HEIGHT + 10),
                        width: "100%",
                    } }) })) }) }));
});
InvoicesComboBox.displayName = "InvoicesComboBox";
