import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { Combobox, Field, InfoLabel, makeStyles, Option, Skeleton, SkeletonItem, tokens, useId, } from "@fluentui/react-components";
import { List as VirtualList } from "react-window";
import { startTransition } from "react";
import { PersonLightning20Regular } from "@fluentui/react-icons";
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
export const DisputeHandlersCombobox = React.memo(({ disputeHandlers, selectedDisputeHandler, onSelectedChange, isLoading = false, error, }) => {
    const comboId = useId();
    const selectedOptionValue = selectedDisputeHandler
        ? selectedDisputeHandler.DHECOD
        : undefined;
    const styles = useStyles();
    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [search, setSearch] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);
    // wynik filtrowania trzymamy w stanie
    const [filteredDisputeHandlers, setfilteredDisputeHandlers] = React.useState(disputeHandlers);
    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
        startTransition(() => {
            const q = deferredSearch.trim();
            if (!q) {
                setfilteredDisputeHandlers(disputeHandlers);
                return;
            }
            const s = q.toLowerCase();
            console.log("Filtering invoices with query:", s);
            setfilteredDisputeHandlers(disputeHandlers.filter((c) => c.DHECOD.toLowerCase().includes(s) ||
                c.DHEDES.toLowerCase().includes(s)));
        });
    }, [disputeHandlers, deferredSearch]);
    React.useEffect(() => {
        if (isTyping)
            return;
        if (!selectedDisputeHandler) {
            setSearch("");
            return;
        }
        setSearch(`${selectedDisputeHandler?.DHEDES} (${selectedDisputeHandler?.DHECOD})`);
    }, [selectedDisputeHandler, isTyping]);
    const onOptionSelect = (_, data) => {
        const id = data.optionValue ? data.optionValue : null;
        const findDisputeHandler = filteredDisputeHandlers.find((c) => c.DHECOD === id) || null;
        onSelectedChange(findDisputeHandler);
        if (id == null || !findDisputeHandler) {
            setIsTyping(false);
            setSearch("");
            return;
        }
        setIsTyping(false);
        setSearch(`${findDisputeHandler?.DHEDES} (${findDisputeHandler?.DHECOD})`);
    };
    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    const Row = ({ index, style }) => {
        const disputeHandler = filteredDisputeHandlers[index];
        const primaryText = `${disputeHandler?.DHEDES} (${disputeHandler?.DHECOD})`;
        // 👇 useMemo: highlight liczy się tylko, gdy zmieni się tekst lub zapytanie
        const highlighted = React.useMemo(() => highlightMatch(primaryText, deferredSearch), [primaryText, deferredSearch]);
        return (_jsx("div", { style: style, children: _jsx(Option, { className: styles.rowBase, value: disputeHandler.DHECOD.toString(), text: `${disputeHandler?.DHEDES} (${disputeHandler?.DHECOD})`, children: _jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [_jsx(PersonLightning20Regular, {}), _jsx("span", { children: highlighted })] }) }, disputeHandler.DHECOD) }));
    };
    return (_jsx(_Fragment, { children: _jsx(Field, { size: "small", label: _jsx(InfoLabel, { info: "Example info", size: "small", children: "Dispute Handler" }), required: true, validationState: error ? "error" : "none", validationMessage: error || "", children: isLoading ? (_jsx(Skeleton, { "aria-label": "Loading Content", children: _jsx(SkeletonItem, { shape: "rectangle", size: 24 }) })) : (_jsx(Combobox, { tabIndex: 0, clearable: true, size: "small", "aria-labelledby": comboId, placeholder: "Enter dispute handler", 
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
                        setfilteredDisputeHandlers(disputeHandlers);
                        setIsTyping(false);
                    }
                }, selectedOptions: selectedOptionValue ? [selectedOptionValue] : [], style: { minWidth: "unset", width: "100%", maxWidth: "100%" }, input: { style: { width: "100%" } }, children: _jsx(VirtualList, { className: styles.listRoot, rowComponent: Row, rowCount: filteredDisputeHandlers.length, rowHeight: ITEM_HEIGHT, rowProps: { disputeHandlers: filteredDisputeHandlers }, style: {
                        height: Math.min(LIST_HEIGHT, filteredDisputeHandlers.length * ITEM_HEIGHT + 10),
                        width: "100%",
                    } }) })) }) }));
});
DisputeHandlersCombobox.displayName = "DisputeHandlersCombobox";
