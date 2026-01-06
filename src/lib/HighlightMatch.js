import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from "@fluentui/react-components";
export const highlightMatch = (textInput, query) => {
    const text = String(textInput ?? "");
    const q = String(query ?? "").trim();
    if (!q)
        return text;
    // escapowanie znaków regex
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // dzielimy na dopasowania i pozostałe fragmenty (case-insensitive)
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    const qLower = q.toLowerCase();
    return parts.map((part, i) => part.toLowerCase() === qLower ? (_jsx("mark", { style: {
            backgroundColor: tokens.colorSubtleBackgroundSelected,
            color: tokens.colorNeutralForeground1,
            padding: "0 2px",
            borderRadius: tokens.borderRadiusSmall,
            fontWeight: tokens.fontWeightSemibold,
        }, children: part }, i)) : (_jsx("span", { children: part }, i)));
};
