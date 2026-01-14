# Standard komponentów typu Combobox (Fluent UI v9) – dla Agenta AI (LLM)

Ten dokument opisuje zasady tworzenia komponentów „combobox” w tym repozytorium na podstawie istniejących implementacji (m.in. `DisputeHandlersCombobox`, `DisputeTypesCombobox`, `InvoicesComboBox`, `PrioritiesCombobox`, `CustomerCombobox`).

## Cel i zakres

- Ujednolicić API, architekturę i stylowanie comboboxów.
- Zachować zgodność z: React + TypeScript (strict), Vite, Fluent UI v9, Office/Outlook sandbox.
- Zapewnić: wydajność dla dużych list (filtrowanie + wirtualizacja), spójne zachowanie inputu i wyboru, obsługę stanu `loading` i `error`.

## Twarde reguły projektu

- Używaj wyłącznie Fluent UI v9 (`@fluentui/react-components`) dla UI.
- Nie dodawaj nowych zależności bez wyraźnej prośby.
- Nie używaj `any`; typy propsów i danych mają być jawne.
- Preferuj `makeStyles` + `tokens`; unikaj własnego CSS i inline-styles.
  - Wyjątki inline-style są akceptowalne tylko dla:
    - `style` przekazywanego przez `react-window` do wrappera wiersza,
    - drobnych, lokalnych korekt layoutu jeśli nie da się tego sensownie wyciągnąć do `makeStyles`.
- Nie zostawiaj `console.log` w filtrowaniu/renderze.

## Konwencje nazewnictwa

- Plik: `XxxComboBox.tsx` (utrzymujemy istniejące nazewnictwo plików).
- Export komponentu: `XxxCombobox` (camelCase z małym „b” – zgodnie z istniejącymi komponentami).
- Typ propsów: `XxxComboboxProps`.
- Na końcu pliku: `XxxCombobox.displayName = "XxxCombobox"`.
- Komponent powinien być opakowany w `React.memo` (zostawiamy to jako standard, bo jest już używany).

## Architektura (data-flow)

### 1) Komponent „controlled” po stronie selekcji

- Selekcja jest kontrolowana z zewnątrz:
  - `selectedXxx: T | null` (lub `T | undefined` gdy tak jest w modelu),
  - `onSelectedChange: (next: T | null) => void`.
- Komponent NIE trzyma w stanie wybranego obiektu jako „source of truth” (stan z rodzica jest prawdą).

### 2) Komponent „semi-controlled” po stronie tekstu inputu

- Input w `Combobox` jest kontrolowany lokalnym stanem string:
  - `const [search, setSearch] = React.useState<string>("");`
- Gdy rodzic zmienia `selectedXxx`, komponent synchronizuje tekst inputu z wyborem.

### 3) Ochrona przed nadpisaniem wpisywania (flaga `isTyping`)

- Standard:
  - `const [isTyping, setIsTyping] = React.useState(false);`
  - Jeśli `isTyping === true`, efekt synchronizacji inputu z `selectedXxx` nie powinien nadpisywać tekstu.
- `onChange` ustawia `isTyping(true)`.
- `onOptionSelect` i `onOpenChange(open=true)` kończą tryb wpisywania (`setIsTyping(false)`).

## Filtrowanie – standard wydajnościowy

### Minimalny standard

- Filtrowanie ma być case-insensitive.
- Zawsze trimuj zapytanie: `const q = deferredSearch.trim();`.
- Dla pustego zapytania zwracaj pełną listę.

### Dla dużych list (zalecane)

- Użyj:
  - `const deferredSearch = React.useDeferredValue(search);`
  - `startTransition(() => { /* setFiltered(...) */ })`
- Trzymaj wynik filtrowania w stanie, gdy używasz `startTransition`:
  - `const [filtered, setFiltered] = React.useState<T[]>(items);`

### Dla małych list (opcjonalnie)

- Możesz użyć `useMemo` zamiast `startTransition`, jeśli filtr jest lekki.

## Wirtualizacja listy (react-window)

- Dla list, które mogą być długie, używaj `react-window`.
- Stałe:
  - `ITEM_HEIGHT` – realna wysokość wiersza.
  - `LIST_HEIGHT` – maksymalna wysokość dropdowna.
- Wysokość listy licz jako:
  - `height: Math.min(LIST_HEIGHT, rowCount * ITEM_HEIGHT + padding)`

### Row – reguły implementacyjne

- Wrapper wiersza MUSI przyjąć `style` z `react-window`:
  - `<div style={style}> ... </div>`
- W środku renderuj Fluent UI `Option`.

## Fluent UI Combobox – kontrakt i zachowania

### `Option.value` i `selectedOptions`

- `Option.value` przekazuj jako `string`.
- `selectedOptions` zawsze jako tablica `string[]`:
  - `selectedOptions={selectedOptionValue ? [selectedOptionValue] : []}`
- Jeśli identyfikator jest liczbowy, zawsze konwertuj do string (`toString()`).

### `Option.text` (ważne)

- `text` powinien odpowiadać temu, co chcesz widzieć w polu po wyborze.
- Ułatwia to wbudowane zachowania comboboxa (m.in. dopasowania i accessibility).

### `onChange` (pisanie w input)

Standard:

- `setIsTyping(true)`
- `setSearch(ev.target.value)`
- `onSelectedChange(null)` (wpisywanie ręczne kasuje aktualny wybór)

### `onOptionSelect` (wybór z listy)

Standard:

- Odczytaj `data.optionValue`.
- Znajdź obiekt po id w **aktualnie filtrowanej** liście (żeby wybór był spójny z renderem).
- Wywołaj `onSelectedChange(foundOrNull)`.
- Ustaw `setIsTyping(false)`.
- Zaktualizuj `search` tekstem reprezentującym wybór.
- Jeśli `optionValue` jest puste lub nie znaleziono elementu – wyczyść input.

### `onOpenChange`

- Przy otwarciu dropdowna (`data.open === true`):
  - resetuj filtrowaną listę do pełnej,
  - kończ tryb wpisywania (`setIsTyping(false)`).

### Rozmiar i szerokość

- W tym projekcie standard to `size="small"`.
- Komponent powinien być pełnej szerokości kontenera:
  - `style={{ minWidth: "unset", width: "100%", maxWidth: "100%" }}`
  - `input={{ style: { width: "100%" } }}`

Docelowo (jeśli to możliwe) przenoś te style do `makeStyles`.

## Obsługa stanu: loading i error

- Preferowany wrapper: Fluent UI `Field`.
- `Field` standardowo ma:
  - `size="small"`
  - `required` jeśli pole jest wymagane w formularzu
  - `validationState={error ? "error" : "none"}`
  - `validationMessage={error || ""}`
- Gdy `isLoading === true`, renderuj `Skeleton` zamiast `Combobox`.

## Stylowanie (makeStyles + tokens)

### Standard listy i opcji

- Lista:
  - `overflowX: "hidden"`
  - stała wysokość (np. 200–360px) zależnie od pola
- Wiersz/Option:
  - `display: "flex"`, `alignItems: "center"`, `gap: tokens.spacingHorizontalM`
  - paddingi z `tokens.spacing*`
  - hover: `tokens.colorSubtleBackgroundHover`
  - selected: `tokens.colorSubtleBackgroundSelected` (jeśli potrzebujesz wizualnego wyróżnienia)
- Tekst:
  - `minWidth: 0`, `overflow: "hidden"`
  - `whiteSpace: "nowrap"`, `textOverflow: "ellipsis"`

### Dodatkowe UI (ikony, kropki, akcenty)

- Ikony: używaj `@fluentui/react-icons`.
- Jeśli musisz stylować sam input (np. kropka priorytetu), stosuj selektor `& input` w klasie `makeStyles`.

## Highlight wyszukiwania

- Jeśli w opcjach ma być podświetlanie dopasowania, używaj istniejącego helpera `highlightMatch`.
- Obliczenia highlightu mogą być w `useMemo`, zależnie od `primaryText` i `deferredSearch`.

## Dostępność (A11y) – minimalny standard

- Każdy combobox musi mieć czytelną etykietę.
- Preferowany wariant: `Field` + `InfoLabel` (spójne z UI formularza).
- Jeśli nie używasz `Field`, to:
  - dodaj `<label id={comboId}>…</label>` i podepnij `aria-labelledby={comboId}`.
- Nie ustawiaj `aria-labelledby` na id, które nie istnieje w DOM.
- Placeholder nie jest etykietą.

## Checklist dla Agenta AI – przed uznaniem zadania za gotowe

- [ ] Plik i export nazwane zgodnie ze standardem.
- [ ] Brak `any` i brak `console.log`.
- [ ] `Combobox` jest pełnej szerokości.
- [ ] `onChange` czyści selekcję (`onSelectedChange(null)`).
- [ ] `onOptionSelect` ustawia selekcję i synchronizuje tekst inputu.
- [ ] Jest `isTyping`, żeby nie nadpisywać wpisywania.
- [ ] Filtrowanie jest case-insensitive + trim.
- [ ] Dla dużych list jest `react-window` + stałe `ITEM_HEIGHT`/`LIST_HEIGHT`.
- [ ] Stylowanie jest w `makeStyles` i używa `tokens`.
- [ ] Loading: `Skeleton`. Error: `Field.validationState/validationMessage`.
- [ ] A11y: label poprawnie powiązany.

## Minimalny szablon (skrót)

Poniżej skrót struktury (nie kopiuj 1:1; dopasuj typy i pola):

```tsx
export type XxxComboboxProps = {
  items: T[];
  selectedItem: T | null;
  onSelectedChange: (next: T | null) => void;
  isLoading: boolean;
  error: string;
};

export const XxxCombobox = React.memo((props: XxxComboboxProps) => {
  const [search, setSearch] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const deferredSearch = React.useDeferredValue(search);
  // ... filtered state + effects
  // ... onChange / onOptionSelect / onOpenChange
  // ... Field + Skeleton + Combobox + react-window
});

XxxCombobox.displayName = "XxxCombobox";
```
