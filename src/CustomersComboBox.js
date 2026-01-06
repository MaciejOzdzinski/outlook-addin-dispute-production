import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Combobox, Option, Persona, useId, } from "@fluentui/react-components";
import { List } from "react-window";
const ITEM_HEIGHT = 50; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna
// Komponent CustomerCombobox z Fluent UI Combobox i react-window i memoizacją
export const CustomerCombobox = React.memo(({ customers, onSelectedChange }) => {
    const comboId = useId();
    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [query, setQuery] = React.useState("");
    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredQuery = React.useDeferredValue(query);
    // filtrowanie po id + name + email, ale na opóźnionej wartości
    const filteredCustomers = React.useMemo(() => {
        const q = deferredQuery.toLowerCase();
        if (!q)
            return customers;
        return customers.filter((c) => {
            const haystack = `${c.NANUM} ${c.NANAME}`.toLowerCase();
            return haystack.includes(q);
        });
    }, [customers, deferredQuery]);
    const onOptionSelect = (_, data) => {
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
    const Row = ({ index, style, customers }) => {
        const customer = customers[index];
        return (_jsx("div", { style: style, children: _jsx(Option, { value: customer.NANUM, text: `${customer.NANUM} - ${customer.NANAME}`, children: _jsx(Persona, { avatar: { color: "colorful", "aria-hidden": true }, name: `${customer.NANUM} - ${customer.NANAME}`, secondaryText: "Customer", presence: { status: "available" } }) }, customer.NANUM) }));
    };
    return (_jsxs("div", { style: { width: "100%" }, children: [_jsx("label", { id: comboId, children: "Customer" }), _jsx(Combobox, { clearable: true, size: "small", "aria-labelledby": comboId, placeholder: "Select customer...", 
                // to, co jest w polu input
                value: query, 
                // pisanie w input -> zmiana query + czyszczenie wyboru
                onChange: (ev) => {
                    // użytkownik coś pisze → aktualizujemy query
                    setQuery(ev.target.value);
                    // wpisywanie ręczne kasuje aktualny wybór
                    onSelectedChange(null);
                }, onOptionSelect: onOptionSelect, style: { width: "100%" }, children: _jsx(List, { rowComponent: Row, rowCount: filteredCustomers.length, rowHeight: ITEM_HEIGHT, rowProps: { customers: filteredCustomers }, style: {
                        height: Math.min(LIST_HEIGHT, filteredCustomers.length * ITEM_HEIGHT + 10),
                        width: "100%",
                    } }) })] }));
});
CustomerCombobox.displayName = "CustomerCombobox";
