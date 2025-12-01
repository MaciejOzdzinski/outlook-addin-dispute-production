/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Text,
  Input,
  makeStyles,
  useId,
} from "@fluentui/react-components";

import { List } from "react-window";
import { EXAMPLE_CUSTOMERS } from "./data";
import { CustomersApi } from "./api/disputesApi";
import type { Customer } from "./dto/dto";
import { LocationAddFilled } from "@fluentui/react-icons";
import { excustomers } from "./api/data";
import { CustomerCombobox } from "./CustomersComboBox";

const useStyles = makeStyles({
  root: {
    // Stack the label above the field with a gap
    display: "grid",
    gridTemplateRows: "repeat(1fr)",
    justifyItems: "start",
    gap: "2px",
    maxWidth: "400px",
  },
});

// Główny komponent aplikacji
// Odczytuje nadawcę z kontekstu Office i pobiera klientów z API
// Wyświetla combobox do wyboru klienta, który jest filtrowany po id/name/email
// Obsługuje błędy i ładowanie danych
// Wyświetla wybranego klienta i jego dane
// Używa Fluent UI Components i react-window do wydajnego renderowania listy klientów
// Używa useCallback i useMemo do optymalizacji wydajności
// Używa useDeferredValue do opóźnionego filtrowania listy klientów
// Używa useId do generowania unikalnych identyfikatorów dla elementów UI
// Używa makeStyles do stylizacji komponentów

export const App = () => {
  const [senderEmail, setSenderEmail] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

  // tekst z pola Search – filtruje listę po id/name/email
  const [searchCustomerText, setSearchCustomerText] = useState<string>("");

  const comboId = useId("combo-default");

  // Funkcja do obsługi zmiany wybranego klienta - stabilna referencja
  const handleCustomerChange = useCallback(
    (id: number | null) => setSelectedCustomerId(id),
    []
  );

  // ===== 1. Odczyt nadawcy i pobranie klientów z API =====
  // Funkcja ładująca klientów z API i ma sabilna referencję dzięki useCallback
  const loadAll = useCallback(
    async (email: Customer["email"]): Promise<void> => {
      setLoading(true);
      setError(null);
      console.log("Loading customers for email:", email);

      try {
        const data = await CustomersApi.getAll();
        //const data = excustomers;
        setCustomers(data as Customer[]);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Error while loading customers.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    try {
      // Read sender from Office context and load example customers
      const item = Office.context?.mailbox?.item;

      if (!item || !item.from) {
        setError("Cannot access current message or sender.");
        return;
      }

      const email = item.from.emailAddress as string | undefined;

      if (!email) {
        setError("Sender email address not found.");
        return;
      }

      setSenderEmail(email);
      loadAll(email);
    } catch (e) {
      console.error(e);
      setError("Unexpected error while reading email.");
    }
  }, []);

  const handleReload = () => {
    if (senderEmail) {
      loadAll(senderEmail);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
      }}
    >
      {/* Nagłówek + reload */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text weight="semibold" size={400}>
          Customers for sender
        </Text>

        <Button
          appearance="primary"
          size="small"
          onClick={handleReload}
          disabled={!senderEmail || loading}
        >
          Reload
        </Button>
      </div>

      {/* Info o nadawcy */}
      <div>
        <Text weight="semibold">Sender email: </Text>
        <Text>{senderEmail ?? "(not available)"}</Text>
      </div>

      {loading && <Text size={200}>Loading customers...</Text>}

      {error && (
        <Text size={200} style={{ color: "#c50f1f", whiteSpace: "pre-wrap" }}>
          Error: {error}
        </Text>
      )}

      {/* Search + Combobox tylko gdy mamy dane */}
      {!loading && !error && customers.length > 0 && (
        <>
          {/* Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Text size={200}>Search (id / name / country):</Text>
            <Input
              value={searchCustomerText}
              onChange={(_, data) => setSearchCustomerText(data.value)}
              appearance="outline"
              size="small"
              placeholder="Type to filter customers..."
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label id={comboId}>Select customer:</label>

            <CustomerCombobox
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onSelectedChange={handleCustomerChange}
            />
          </div>
        </>
      )}

      {/* Brak klientów */}
      {!loading && !error && senderEmail && customers.length === 0 && (
        <Text size={200}>No customers found for this email.</Text>
      )}

      {/* Podgląd wybranego klienta */}
      {selectedCustomerId != null && (
        <div style={{ marginTop: "auto" }}>
          <Text weight="semibold" size={200}>
            Selected customer:
          </Text>
          <br />
          <Text size={200}>
            {(() => {
              const c = customers.find((x) => x.id === selectedCustomerId);
              if (!c) return `ID: ${selectedCustomerId}`;
              return `${c.name} (${c.email}), ID: ${c.id}`;
            })()}
          </Text>
        </div>
      )}
    </div>
  );
};

export default App;
