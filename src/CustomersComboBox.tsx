import * as React from "react";
import {
  Combobox,
  Option,
  Persona,
  useId,
  type ComboboxProps,
} from "@fluentui/react-components";
import { List, type RowComponentProps } from "react-window";

type Customer = {
  id: number;
  name: string;
  email: string;
};

const ITEM_HEIGHT = 50; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna

export type CustomerComboboxProps = {
  customers: Customer[];
  selectedCustomerId: number | null;
  onSelectedChange: (id: number | null) => void;
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
        const haystack = `${c.id} ${c.name} ${c.email}`.toLowerCase();
        return haystack.includes(q);
      });
    }, [customers, deferredQuery]);

    const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
      const id = data.optionValue ? Number(data.optionValue) : null;
      onSelectedChange(id);

      if (id == null) {
        setQuery("");
        return;
      }

      const customer = customers.find((c) => c.id === id);
      // 👇 to jest dokładnie to, co chcesz widzieć w polu:
      setQuery(customer ? `${customer.id} - ${customer.name}` : "");
    };

    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----
    type RowData = { customers: Customer[] };

    const Row = ({ index, style, customers }: RowComponentProps<RowData>) => {
      const customer = customers[index];

      return (
        <div style={style}>
          <Option
            key={customer.id}
            value={customer.id.toString()}
            text={`${customer.id} - ${customer.name}`}
          >
            <Persona
              avatar={{ color: "colorful", "aria-hidden": true }}
              name={`${customer.id} - ${customer.name}`}
              secondaryText={customer.email}
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
