/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="office-js" />

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  type Theme,
} from "@fluentui/react-components";
import { Guitar16Filled } from "@fluentui/react-icons";

// pomocniczo: policz jasność koloru #RRGGBB
function getLuminanceFromHex(hex: string): number {
  if (!hex) return 1; // traktuj jako jasny
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 1;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  // standardowa formuła postrzeganej jasności
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function detectInitialTheme(): Theme {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  // 1) Jeśli jesteśmy w Outlooku i Office udostępnił officeTheme
  if (win.Office && win.Office.context && win.Office.context.officeTheme) {
    const officeTheme = win.Office.context.officeTheme;
    const bg = officeTheme.bodyBackgroundColor as string | undefined;

    const lum = getLuminanceFromHex(bg || "#ffffff");
    // prosty próg – < 0.5 traktujemy jako ciemny motyw
    return lum < 0.5 ? webDarkTheme : webLightTheme;
  }

  // 2) Dev w przeglądarce: użyj systemowego dark/light
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return webDarkTheme;
  }

  return webLightTheme;
}

export const Main = () => {
  const [theme, setTheme] = React.useState<Theme>(detectInitialTheme);

  React.useEffect(() => {
    const win = window as any;
    if (!win.Office) return;

    // Po Office.onReady możemy jeszcze raz odczytać motyw (gdyby start był przed)
    Office.onReady(() => {
      try {
        const officeTheme = Office.context.officeTheme;
        if (!officeTheme) return;

        console.log("Office theme:", Office.context.officeTheme);
        console.log(
          "Używany motyw Fluent:",
          theme === webDarkTheme ? "dark" : "light"
        );

        const bg = officeTheme.bodyBackgroundColor as string | undefined;
        const lum = getLuminanceFromHex(bg || "#ffffff");
        setTheme(lum < 0.5 ? webDarkTheme : webLightTheme);

        // (opcjonalnie) jeśli host wspiera event zmiany motywu:
        // tu ostrożnie, bo nie wszystkie klienty Outlooka to wspierają
        const anyOffice = Office as any;
        const eventType = anyOffice.EventType?.OfficeThemeChanged;
        if (eventType && Office.context.document?.addHandlerAsync) {
          Office.context.document.addHandlerAsync(
            eventType,
            () => {
              const t = Office.context.officeTheme;
              const bg2 = t?.bodyBackgroundColor as string | undefined;
              const lum2 = getLuminanceFromHex(bg2 || "#ffffff");
              setTheme(lum2 < 0.5 ? webDarkTheme : webLightTheme);
            },
            () => {
              /* ignore errors w dev */
            }
          );
        }
      } catch (e) {
        console.warn(
          "Cannot read Office theme, falling back to current theme.",
          e
        );
      }
    });
  }, []);

  return (
    <FluentProvider theme={theme}>
      <Guitar16Filled />
      <App />
    </FluentProvider>
  );
};

function render() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("Root element #root not found");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<Main />);
}

// Outlook vs normalna przeglądarka
if (typeof (window as any).Office !== "undefined") {
  Office.onReady(() => {
    render();
  });
} else {
  render();
}
