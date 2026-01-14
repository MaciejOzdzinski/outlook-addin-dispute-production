// @vitest-environment jsdom

import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DocumentsCombobox, type DocumentOption } from "./DocumentsCombobox";

// Fluent UI (Tabster) expects NodeFilter to exist globally.
// jsdom provides it on window, but not always on globalThis.
if (typeof window !== "undefined") {
  const nodeFilter = window.NodeFilter;
  if (typeof globalThis.NodeFilter === "undefined" && nodeFilter) {
    globalThis.NodeFilter = nodeFilter;
  }
}

afterEach(() => {
  cleanup();
});

describe("DocumentsCombobox smoke", () => {
  it("imports and has displayName", () => {
    expect(DocumentsCombobox).toBeTruthy();
    expect(DocumentsCombobox.displayName).toBe("DocumentsCombobox");
  });

  it("renders label and input when not loading", () => {
    render(
      React.createElement(DocumentsCombobox, {
        documents: [],
        selectedDocument: null,
        onSelectedChange: () => undefined,
        isLoading: false,
        error: "",
      })
    );

    expect(screen.getByText("Document")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter document")).toBeTruthy();
  });

  it("shows skeleton when loading", () => {
    render(
      React.createElement(DocumentsCombobox, {
        documents: [],
        selectedDocument: null,
        onSelectedChange: () => undefined,
        isLoading: true,
        error: "",
      })
    );

    expect(screen.getByLabelText("Loading Content")).toBeTruthy();
  });

  it("syncs input value from selectedDocument (when not typing)", async () => {
    const doc: DocumentOption = {
      id: "DOC-1",
      title: "Invoice",
      subtitle: "PDF",
    };

    render(
      React.createElement(DocumentsCombobox, {
        documents: [doc],
        selectedDocument: doc,
        onSelectedChange: () => undefined,
        isLoading: false,
        error: "",
      })
    );

    const input = screen.getByPlaceholderText(
      "Enter document"
    ) as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toBe("Invoice — PDF");
    });
  });

  it("clears selection callback when typing", () => {
    const onSelectedChange = vi.fn();

    render(
      React.createElement(DocumentsCombobox, {
        documents: [{ id: "DOC-1", title: "Invoice" }],
        selectedDocument: { id: "DOC-1", title: "Invoice" },
        onSelectedChange,
        isLoading: false,
        error: "",
      })
    );

    const input = screen.getByPlaceholderText("Enter document");
    fireEvent.change(input, { target: { value: "inv" } });

    expect(onSelectedChange).toHaveBeenCalledWith(null);
  });
});
