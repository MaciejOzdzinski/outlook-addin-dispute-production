import * as React from "react";
import { tokens } from "@fluentui/react-components";

export const highlightMatch = (
  textInput: unknown,
  query: string
): React.ReactNode => {
  const text = String(textInput ?? "");
  const q = String(query ?? "").trim();

  if (!q) return text;

  // escapowanie znaków regex
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // dzielimy na dopasowania i pozostałe fragmenty (case-insensitive)
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const qLower = q.toLowerCase();

  return parts.map((part, i) =>
    part.toLowerCase() === qLower ? (
      <mark
        key={i}
        style={{
          backgroundColor: tokens.colorSubtleBackgroundSelected,
          color: tokens.colorNeutralForeground1,
          padding: "0 2px",
          borderRadius: tokens.borderRadiusSmall,
          fontWeight: tokens.fontWeightSemibold,
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};
