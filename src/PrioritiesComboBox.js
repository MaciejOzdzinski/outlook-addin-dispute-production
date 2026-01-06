import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Combobox, Field, InfoLabel, makeStyles, Option, Skeleton, SkeletonItem, tokens, useId, mergeClasses, } from "@fluentui/react-components";
import { List as VirtualList } from "react-window";
import { startTransition } from "react";
import { highlightMatch } from "./lib/HighlightMatch";
const ITEM_HEIGHT = 32;
const LIST_HEIGHT = 240;
const mapDotColor = (value) => {
    switch (value) {
        case 1: // Critical
            return tokens.colorPaletteRedBackground3; // 🔴
        case 2: // High
            return "#ed763c"; // 🟡
        case 3: // Medium
            return "#115ea3"; // 🔵
        case 4: // Low
            return tokens.colorPaletteGreenBackground3; // 🟢
        default:
            return tokens.colorNeutralBackground3;
    }
};
const useStyles = makeStyles({
    listRoot: {
        height: "200px",
        overflowX: "hidden",
    },
    rowBase: {
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
        paddingBlock: tokens.spacingVerticalS,
        paddingInline: tokens.spacingHorizontalM,
        cursor: "pointer",
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: "transparent",
        transitionProperty: "background-color, transform",
        transitionDuration: tokens.durationFast,
        transitionTimingFunction: tokens.curveEasyEase,
        ":hover": {
            backgroundColor: tokens.colorSubtleBackgroundHover,
            transform: "translateX(1px)",
        },
    },
    fullWidthCombo: {
        width: "100%",
        maxWidth: "none", // 👈 najważniejsze – kasuje ograniczenie Fluent UI
    },
    dot: {
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    priorityDotBase: {
        "& input": {
            paddingLeft: "24px", // miejsce na kropkę
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px center", // pozycja kropki
            backgroundSize: "15px 15px",
        },
    },
    priorityCritical: {
        "& input": {
            backgroundImage: `radial-gradient(${tokens.colorPaletteRedBackground3} 50%, transparent 51%)`,
        },
    },
    priorityHigh: {
        "& input": {
            backgroundImage: `radial-gradient(#ed763c 50%, transparent 51%)`,
        },
    },
    priorityMedium: {
        "& input": {
            backgroundImage: `radial-gradient(#115ea3 50%, transparent 51%)`,
        },
    },
    priorityLow: {
        "& input": {
            backgroundImage: `radial-gradient(${tokens.colorPaletteGreenBackground3} 50%, transparent 51%)`,
        },
    },
    rowSelected: {
        backgroundColor: tokens.colorSubtleBackgroundSelected,
        ":hover": {
            backgroundColor: tokens.colorSubtleBackgroundSelected,
            transform: "none",
        },
    },
    colorDot: {
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    iconWrapper: {
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    textContainer: {
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
    },
    titleLine: {
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        fontWeight: tokens.fontWeightSemibold,
    },
    subtitle: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
});
export const PrioritiesCombobox = React.memo(({ priorities, selectedPriority, onSelectedChange, isLoading = false, error = "", containerStyle, }) => {
    const comboId = useId();
    const styles = useStyles();
    // sortowanie Critical(1) → High(2) → Medium(3) → Low(4)
    const sortedPriorities = React.useMemo(() => [...priorities].sort((a, b) => a.value - b.value), [priorities]);
    const selectedOptionValue = selectedPriority
        ? selectedPriority.value.toString()
        : undefined;
    // tekst wpisany w combobox
    const [search, setSearch] = React.useState("");
    const [isTyping, setIsTyping] = React.useState(false);
    // opóźniona wartość do filtrowania
    const deferredSearch = React.useDeferredValue(search);
    const [filteredPriorities, setFilteredPriorities] = React.useState(sortedPriorities);
    // gdy zmieni się lista priorytetów -> reset filtrowania
    React.useEffect(() => {
        setFilteredPriorities(sortedPriorities);
    }, [sortedPriorities]);
    // filtrowanie listy priorytetów
    React.useEffect(() => {
        startTransition(() => {
            const q = deferredSearch.trim();
            if (!q) {
                setFilteredPriorities(sortedPriorities);
                return;
            }
            const s = q.toLowerCase();
            setFilteredPriorities(sortedPriorities.filter((p) => p.label.toLowerCase().includes(s) ||
                p.value.toString().includes(s)));
        });
    }, [sortedPriorities, deferredSearch]);
    // ✅ Sync input value z selectedPriority (gdy parent ustawi wartość)
    React.useEffect(() => {
        if (isTyping)
            return;
        if (!selectedPriority) {
            setSearch("");
            return;
        }
        setSearch(selectedPriority.label);
    }, [selectedPriority, isTyping]);
    const onOptionSelect = (_, data) => {
        const val = data.optionValue ? Number(data.optionValue) : null;
        const found = filteredPriorities.find((p) => p.value === val) ?? null;
        onSelectedChange(found);
        // user wybrał z listy → nie jest w trybie pisania
        setIsTyping(false);
        if (val == null || !found) {
            setSearch("");
            return;
        }
        setSearch(found.label);
    };
    // wiersz do react-window
    const Row = ({ index, style }) => {
        const priority = filteredPriorities[index];
        const primaryText = `${priority.label} (${priority.value})`;
        const highlighted = React.useMemo(() => highlightMatch(primaryText, deferredSearch), [primaryText, deferredSearch]);
        const isSelected = selectedPriority && selectedPriority.value === priority.value;
        return (_jsx("div", { style: style, children: _jsxs(Option, { className: mergeClasses(styles.rowBase, isSelected ? styles.rowSelected : undefined), value: priority.value.toString(), text: priority.label, children: [_jsx("div", { className: styles.colorDot, style: { backgroundColor: mapDotColor(priority.value) } }), _jsx("div", { className: styles.textContainer, children: _jsx("span", { className: styles.titleLine, children: highlighted }) })] }, priority.value) }));
    };
    const priorityInputClass = React.useMemo(() => {
        if (!selectedPriority)
            return undefined;
        const base = styles.priorityDotBase;
        switch (selectedPriority.value) {
            case 1:
                return mergeClasses(base, styles.priorityCritical);
            case 2:
                return mergeClasses(base, styles.priorityHigh);
            case 3:
                return mergeClasses(base, styles.priorityMedium);
            case 4:
                return mergeClasses(base, styles.priorityLow);
            default:
                return base;
        }
    }, [selectedPriority, styles]);
    return (_jsx(Field, { size: "small", label: _jsx(InfoLabel, { info: "Select business priority for this dispute", size: "small", children: "Priority" }), required: true, validationState: error ? "error" : "none", validationMessage: error || "", style: { ...containerStyle }, children: isLoading ? (_jsx(Skeleton, { "aria-label": "Loading Content", children: _jsx(SkeletonItem, { shape: "rectangle", size: 24 }) })) : (_jsx(Combobox, { tabIndex: 0, clearable: true, size: "small", "aria-labelledby": comboId, placeholder: "Enter priority", value: search, onChange: (ev) => {
                setIsTyping(true);
                setSearch(ev.target.value);
                onSelectedChange(null);
            }, onOptionSelect: onOptionSelect, onOpenChange: (_, data) => {
                if (data.open) {
                    setFilteredPriorities(sortedPriorities);
                    setIsTyping(false);
                }
            }, selectedOptions: selectedOptionValue ? [selectedOptionValue] : [], style: { minWidth: "unset", width: "100%", maxWidth: "100%" }, input: { style: { width: "100%" } }, className: priorityInputClass, children: _jsx(VirtualList, { className: styles.listRoot, rowComponent: Row, rowCount: filteredPriorities.length, rowHeight: ITEM_HEIGHT, rowProps: { priorities: filteredPriorities }, style: {
                    width: "100%",
                    height: Math.min(LIST_HEIGHT, filteredPriorities.length * ITEM_HEIGHT),
                } }) })) }));
});
PrioritiesCombobox.displayName = "PrioritiesCombobox";
