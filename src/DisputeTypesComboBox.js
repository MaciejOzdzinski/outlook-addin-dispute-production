import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Combobox, Field, InfoLabel, makeStyles, Option, Skeleton, SkeletonItem, tokens, useId, } from "@fluentui/react-components";
import { List as VirtualList } from "react-window";
import { startTransition } from "react";
import { highlightMatch } from "./lib/HighlightMatch";
const ITEM_HEIGHT = 32; // wysokość jednego wiersza listy (dopasuj do swojego UI)
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
export const DisputeTypesCombobox = React.memo(({ disputeTypes, selectedDisputeType, onSelectedChange, isLoading = false, error, }) => {
    const comboId = useId();
    const selectedOptionValue = selectedDisputeType
        ? selectedDisputeType.DTHCOD
        : undefined;
    const styles = useStyles();
    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [search, setSearch] = React.useState("");
    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);
    const [isTyping, setIsTyping] = React.useState(false);
    // wynik filtrowania trzymamy w stanie
    const [filteredDisputeTypes, setFilteredDisputeTypes] = React.useState(disputeTypes);
    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
        startTransition(() => {
            const q = deferredSearch.trim();
            if (!q) {
                setFilteredDisputeTypes(disputeTypes);
                return;
            }
            const s = q.toLowerCase();
            console.log("Filtering invoices with query:", s);
            setFilteredDisputeTypes(disputeTypes.filter((c) => c.DTHCOD.toLowerCase().includes(s) ||
                c.DTHDES.toLowerCase().includes(s)));
        });
    }, [disputeTypes, deferredSearch]);
    React.useEffect(() => {
        if (isTyping)
            return;
        if (!selectedDisputeType) {
            setSearch("");
            return;
        }
        setSearch(`${selectedDisputeType.DTHDES} (${selectedDisputeType.DTHCOD})`);
    }, [selectedDisputeType, isTyping]);
    const onOptionSelect = (_, data) => {
        const id = data.optionValue ? data.optionValue : null;
        const findDisputeType = filteredDisputeTypes.find((c) => c.DTHCOD === id) || null;
        onSelectedChange(findDisputeType);
        if (id == null || !findDisputeType) {
            setIsTyping(false);
            setSearch("");
            return;
        }
        setIsTyping(false);
        setSearch(`${findDisputeType?.DTHDES} (${findDisputeType?.DTHCOD})`);
    };
    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    const Row = ({ index, style }) => {
        const disputeType = filteredDisputeTypes[index];
        const primaryText = `${disputeType?.DTHDES} (${disputeType?.DTHCOD})`;
        // 👇 useMemo: highlight liczy się tylko, gdy zmieni się tekst lub zapytanie
        const highlighted = React.useMemo(() => highlightMatch(primaryText, deferredSearch), [primaryText, deferredSearch]);
        return (_jsx("div", { style: style, children: _jsx(Option, { className: styles.rowBase, value: disputeType.DTHCOD.toString(), text: `${disputeType?.DTHDES} (${disputeType?.DTHCOD})`, children: _jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: _jsx("span", { children: highlighted }) }) }, disputeType.DTHCOD) }));
    };
    return (_jsx(_Fragment, { children: _jsx(Field, { size: "small", label: _jsx(InfoLabel, { info: "Example info", size: "small", children: "Dispute Type" }), required: true, validationState: error ? "error" : "none", validationMessage: error || "", children: isLoading ? (_jsx(Skeleton, { "aria-label": "Loading Content", children: _jsx(SkeletonItem, { shape: "rectangle", size: 24 }) })) : (_jsx(Combobox, { tabIndex: 0, clearable: true, size: "small", "aria-labelledby": comboId, placeholder: "Enter dispute type", 
                // to, co jest w polu input
                value: search, 
                // pisanie w input -> zmiana query + czyszczenie wyboru
                onChange: (ev) => {
                    // użytkownik coś pisze → aktualizujemy query
                    setSearch(ev.target.value);
                    // wpisywanie ręczne kasuje aktualny wybór
                    onSelectedChange(null);
                }, onOptionSelect: onOptionSelect, onOpenChange: (_, data) => {
                    if (data.open) {
                        // chcemy znowu zobaczyć wszystkie faktury
                        setFilteredDisputeTypes(disputeTypes);
                        setIsTyping(false);
                    }
                }, selectedOptions: selectedOptionValue ? [selectedOptionValue] : [], style: { minWidth: "unset", width: "100%", maxWidth: "100%" }, input: { style: { width: "100%" } }, children: _jsx(VirtualList, { className: styles.listRoot, rowComponent: Row, rowCount: filteredDisputeTypes.length, rowHeight: ITEM_HEIGHT, rowProps: { disputeTypes: filteredDisputeTypes }, style: {
                        height: Math.min(LIST_HEIGHT, filteredDisputeTypes.length * ITEM_HEIGHT + 10),
                        width: "100%",
                    } }) })) }) }));
});
DisputeTypesCombobox.displayName = "DisputeTypesComboboxProps";
