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
import type { ICASODPH } from "./dto/dto";
import { startTransition } from "react";
import { DocumentText20Regular } from "@fluentui/react-icons";
import { highlightMatch } from "./lib/HighlightMatch";

const ITEM_HEIGHT = 46; // wysokość jednego wiersza listy (dopasuj do swojego UI)
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

export type disputeHandlersComboboxProps = {
  disputeHandlers: ICASODPH[];
  selectedDisputeHandler: ICASODPH | null;
  onSelectedChange: (CASODPH: ICASODPH | null) => void;
  isLoading: boolean;
  error: string;
};

// Komponent CustomerCombobox z Fluent UI Combobox i react-window i memoizacją
export const DisputeHandlersCombobox = React.memo(
  ({
    disputeHandlers,
    selectedDisputeHandler,
    onSelectedChange,
    isLoading = false,
    error,
  }: disputeHandlersComboboxProps) => {
    const comboId = useId();

    const selectedOptionValue = selectedDisputeHandler
      ? selectedDisputeHandler.DHECOD
      : undefined;

    const styles = useStyles();

    // tekst wpisany w combobox (to, co user widzi w input comboboxa)
    const [search, setSearch] = React.useState<string>("");

    // 🚀 opóźniona wartość do ciężkiego filtrowania
    const deferredSearch = React.useDeferredValue(search);

    // wynik filtrowania trzymamy w stanie
    const [filteredDisputeHandlers, setfilteredDisputeHandlers] =
      React.useState<ICASODPH[]>(disputeHandlers);

    // przelicz filtrowaną listę w transition
    React.useEffect(() => {
      startTransition(() => {
        const q = deferredSearch.trim();

        if (!q) {
          setfilteredDisputeHandlers(disputeHandlers);
          return;
        }

        const s = q.toLowerCase();

        console.log("Filtering invoices with query:", s);

        setfilteredDisputeHandlers(
          disputeHandlers.filter(
            (c) =>
              c.DHECOD.toLowerCase().includes(s) ||
              c.DHEDES.toLowerCase().includes(s)
          )
        );
      });
    }, [disputeHandlers, deferredSearch]);

    const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
      const id = data.optionValue ? data.optionValue : null;
      const findDisputeHandler =
        filteredDisputeHandlers.find((c) => c.DHECOD === id) || null;
      onSelectedChange(findDisputeHandler);

      if (id == null) {
        setSearch("");
        return;
      }

      setSearch(`${findDisputeHandler?.DHEDES}(${findDisputeHandler?.DHECOD})`);
    };

    // 🔍 pojedynczy wiersz do react-window
    // ---- ROW DLA react-window v2 ----

    const Row = ({ index, style }: RowComponentProps) => {
      const disputeHandler = filteredDisputeHandlers[index];

      const primaryText = `${disputeHandler?.DHEDES}(${disputeHandler?.DHECOD})`;
      // 👇 useMemo: highlight liczy się tylko, gdy zmieni się tekst lub zapytanie
      const highlighted = React.useMemo(
        () => highlightMatch(primaryText, deferredSearch),
        [primaryText, deferredSearch]
      );

      return (
        <div style={style}>
          <Option
            className={styles.rowBase}
            key={disputeHandler.DHECOD}
            value={disputeHandler.DHECOD.toString()}
            text={`${disputeHandler?.DHEDES}(${disputeHandler?.DHECOD})`}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <DocumentText20Regular />

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
              Dispute Handler
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
              placeholder="Enter dispute handler"
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
                  setfilteredDisputeHandlers(disputeHandlers);
                }
              }}
              selectedOptions={selectedOptionValue ? [selectedOptionValue] : []}
              style={{ minWidth: "unset", width: "100%", maxWidth: "100%" }}
              input={{ style: { width: "100%" } }}
            >
              <VirtualList
                className={styles.listRoot}
                rowComponent={Row}
                rowCount={filteredDisputeHandlers.length}
                rowHeight={46}
                rowProps={{ disputeHandlers: filteredDisputeHandlers }}
                style={{
                  height: Math.min(
                    LIST_HEIGHT,
                    filteredDisputeHandlers.length * ITEM_HEIGHT
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

DisputeHandlersCombobox.displayName = "DisputeHandlersCombobox";
