import * as React from "react";
import {
  Combobox,
  Option,
  Persona,
  useId,
  type ComboboxProps,
} from "@fluentui/react-components";
import { List, type RowComponentProps } from "react-window";
import type { ICASOCNT } from "./dto/dto";

const ITEM_HEIGHT = 50; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna

export type CustomerComboboxProps = {
  customers: ICASOCNT[];
  selectedCustomer: ICASOCNT | null;
  onSelectedChange: (casocnt: ICASOCNT | null) => void;
};

// Komponent CustomerCombobox z Fluent UI Combobox i react-window i memoizacją
export const CustomerCombobox = React.memo(
  ({ customers, onSelectedChange }: CustomerComboboxProps) => {
    const comboId = useId();

    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [query, setQuery] = React.useState<string>("");

    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredQuery = React.useDeferredValue(query);

    // filtrowanie po id + name + email, ale na opóźnionej wartości
    const filteredCustomers = React.useMemo(() => {
      const q = deferredQuery.toLowerCase();

      if (!q) return customers;

      return customers.filter((c) => {
        const haystack = `${c.NANUM} ${c.NANAME}`.toLowerCase();
        return haystack.includes(q);
      });
    }, [customers, deferredQuery]);

    const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
      const id = data.optionValue ? data.optionValue : null;

      const findCustomer = customers.find((c) => c.NANUM === id) || null;

      onSelectedChange(findCustomer);

      if (id == null) {
        setQuery("");
        return;
      }

      const customer = customers.find((c) => c.NANUM === id);
      // 👇 to jest dokładnie to, co chcesz widzieć w polu:
      setQuery(customer ? `${customer.NANUM} - ${customer.NANAME}` : "");
    };

    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    type RowData = { customers: ICASOCNT[] };

    const Row = ({ index, style, customers }: RowComponentProps<RowData>) => {
      const customer = customers[index];

      return (
        <div style={style}>
          <Option
            key={customer.NANUM}
            value={customer.NANUM}
            text={`${customer.NANUM} - ${customer.NANAME}`}
          >
            <Persona
              avatar={{ color: "colorful", "aria-hidden": true }}
              name={`${customer.NANUM} - ${customer.NANAME}`}
              secondaryText="Customer"
              presence={{ status: "available" }}
            />
          </Option>
        </div>
      );
    };

    return (
      <div style={{ width: "100%" }}>
        <label id={comboId}>Customer</label>
        <Combobox
          clearable
          size="small"
          aria-labelledby={comboId}
          placeholder="Select customer..."
          // to, co jest w polu input
          value={query}
          // pisanie w input -> zmiana query + czyszczenie wyboru
          onChange={(ev) => {
            // użytkownik coś pisze → aktualizujemy query
            setQuery(ev.target.value);
            // wpisywanie ręczne kasuje aktualny wybór
            onSelectedChange(null);
          }}
          onOptionSelect={onOptionSelect}
          style={{ width: "100%" }}
        >
          <List<RowData>
            rowComponent={Row}
            rowCount={filteredCustomers.length}
            rowHeight={ITEM_HEIGHT}
            rowProps={{ customers: filteredCustomers }}
            style={{
              height: Math.min(
                LIST_HEIGHT,
                filteredCustomers.length * ITEM_HEIGHT
              ),
              width: "100%",
            }}
          />
        </Combobox>
      </div>
    );
  }
);

CustomerCombobox.displayName = "CustomerCombobox";
