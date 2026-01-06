import * as React from "react";
import {
  Combobox,
  Field,
  InfoLabel,
  makeStyles,
  Option,
  Skeleton,
  SkeletonItem,
  tokens,
  useId,
  type ComboboxProps,
} from "@fluentui/react-components";
import { List as VirtualList, type RowComponentProps } from "react-window";
import type { ICASODPT } from "./dto/dto";
import { startTransition } from "react";
import { highlightMatch } from "./lib/HighlightMatch";

const ITEM_HEIGHT = 32; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna

const useStyles = makeStyles({
  listRoot: {
    height: "360px",
    overflowX: "hidden", // lista jako całość nie scrolluje w poziomie
  },

  rowBase: {
    boxSizing: "border-box", // padding mieści się w width od react-window
    width: "100%", // dopasuj do viewportu listy
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    paddingBlock: tokens.spacingVerticalS,
    paddingInline: tokens.spacingHorizontalM,
    cursor: "pointer",
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: "transparent",
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },

  rowSelected: {
    backgroundColor: tokens.colorSubtleBackgroundSelected,
    ":hover": {
      backgroundColor: tokens.colorSubtleBackgroundSelected,
    },
  },

  avatarWrapper: {
    flexShrink: 0,
  },

  textContainer: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // ważne
    minWidth: 0, // pozwala flexowi ścisnąć tekst do szerokości listy
  },

  titleLine: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden", // ellipsis zamiast poziomego scrolla
    fontWeight: tokens.fontWeightSemibold,
  },

  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },

  spinnerContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBlock: tokens.spacingVerticalXS,
  },
});

export type DisputeTypesComboboxProps = {
  disputeTypes: ICASODPT[];
  selectedDisputeType: ICASODPT | null;
  onSelectedChange: (casodpt: ICASODPT | null) => void;
  isLoading: boolean;
  error: string;
};

// Komponent CustomerCombobox z Fluent UI Combobox i react-window i memoizacją
export const DisputeTypesCombobox = React.memo(
  ({
    disputeTypes,
    selectedDisputeType,
    onSelectedChange,
    isLoading = false,
    error,
  }: DisputeTypesComboboxProps) => {
    const comboId = useId();

    const selectedOptionValue = selectedDisputeType
      ? selectedDisputeType.DTHCOD
      : undefined;

    const styles = useStyles();

    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [search, setSearch] = React.useState<string>("");

    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);
    const [isTyping, setIsTyping] = React.useState(false);

    // wynik filtrowania trzymamy w stanie
    const [filteredDisputeTypes, setFilteredDisputeTypes] =
      React.useState<ICASODPT[]>(disputeTypes);

    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
      startTransition(() => {
        const q = deferredSearch.trim();

        if (!q) {
          setFilteredDisputeTypes(disputeTypes);
          return;
        }

        const s = q.toLowerCase();

        console.log("Filtering invoices with query:", s);

        setFilteredDisputeTypes(
          disputeTypes.filter(
            (c) =>
              c.DTHCOD.toLowerCase().includes(s) ||
              c.DTHDES.toLowerCase().includes(s)
          )
        );
      });
    }, [disputeTypes, deferredSearch]);

    React.useEffect(() => {
      if (isTyping) return;

      if (!selectedDisputeType) {
        setSearch("");
        return;
      }

      setSearch(
        `${selectedDisputeType.DTHDES} (${selectedDisputeType.DTHCOD})`
      );
    }, [selectedDisputeType, isTyping]);

    const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
      const id = data.optionValue ? data.optionValue : null;
      const findDisputeType =
        filteredDisputeTypes.find((c) => c.DTHCOD === id) || null;
      onSelectedChange(findDisputeType);

      if (id == null || !findDisputeType) {
        setIsTyping(false);
        setSearch("");
        return;
      }

      setIsTyping(false);

      setSearch(`${findDisputeType?.DTHDES} (${findDisputeType?.DTHCOD})`);
    };

    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----

    const Row = ({ index, style }: RowComponentProps) => {
      const disputeType = filteredDisputeTypes[index];

      const primaryText = `${disputeType?.DTHDES} (${disputeType?.DTHCOD})`;
      // 👇 useMemo: highlight liczy się tylko, gdy zmieni się tekst lub zapytanie
      const highlighted = React.useMemo(
        () => highlightMatch(primaryText, deferredSearch),
        [primaryText, deferredSearch]
      );

      return (
        <div style={style}>
          <Option
            className={styles.rowBase}
            key={disputeType.DTHCOD}
            value={disputeType.DTHCOD.toString()}
            text={`${disputeType?.DTHDES} (${disputeType?.DTHCOD})`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{highlighted}</span>
            </div>
          </Option>
        </div>
      );
    };

    return (
      <>
        <Field
          size="small"
          label={
            <InfoLabel info="Example info" size="small">
              Dispute Type
            </InfoLabel>
          }
          required
          validationState={error ? "error" : "none"}
          validationMessage={error || ""}
        >
          {isLoading ? (
            <Skeleton aria-label="Loading Content">
              <SkeletonItem shape="rectangle" size={24} />
            </Skeleton>
          ) : (
            <Combobox
              tabIndex={0}
              clearable
              size="small"
              aria-labelledby={comboId}
              placeholder="Enter dispute type"
              // to, co jest w polu input
              value={search}
              // pisanie w input -> zmiana query + czyszczenie wyboru
              onChange={(ev) => {
                // użytkownik coś pisze → aktualizujemy query
                setSearch(ev.target.value);
                // wpisywanie ręczne kasuje aktualny wybór
                onSelectedChange(null);
              }}
              onOptionSelect={onOptionSelect}
              onOpenChange={(_, data) => {
                if (data.open) {
                  // chcemy znowu zobaczyć wszystkie faktury
                  setFilteredDisputeTypes(disputeTypes);
                  setIsTyping(false);
                }
              }}
              selectedOptions={selectedOptionValue ? [selectedOptionValue] : []}
              style={{ minWidth: "unset", width: "100%", maxWidth: "100%" }}
              input={{ style: { width: "100%" } }}
            >
              <VirtualList
                className={styles.listRoot}
                rowComponent={Row}
                rowCount={filteredDisputeTypes.length}
                rowHeight={ITEM_HEIGHT}
                rowProps={{ disputeTypes: filteredDisputeTypes }}
                style={{
                  height: Math.min(
                    LIST_HEIGHT,
                    filteredDisputeTypes.length * ITEM_HEIGHT + 10
                  ),
                  width: "100%",
                }}
              />
            </Combobox>
          )}
        </Field>
      </>
    );
  }
);

DisputeTypesCombobox.displayName = "DisputeTypesComboboxProps";
