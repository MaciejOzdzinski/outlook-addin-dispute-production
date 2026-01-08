import React from "react";
import {
  SearchBox,
  List as FluentList,
  ListItem,
  makeStyles,
  tokens,
  Persona,
  mergeClasses,
  Spinner,
} from "@fluentui/react-components";
import { List as VirtualList, type RowComponentProps } from "react-window";

const ITEM_HEIGHT = 46; // wysokość jednego wiersza listy (dopasuj do swojego UI)
const LIST_HEIGHT = 500; // maksymalna wysokość dropdowna

// funkcja podświetlająca fragmenty tekstu pasujące do zapytania
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function highlightMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  primaryText: any,
  deferredSearch: string
): React.ReactNode {
  const text = String(primaryText ?? "");
  const q = String(deferredSearch ?? "").trim();
  if (!q) return text;

  // Escape regex special chars and split keeping matches (case-insensitive)
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const qLower = q.toLowerCase();

  return parts.map((part, i) =>
    part.toLowerCase() === qLower ? (
      <span
        key={i}
        style={{
          backgroundColor: tokens.colorSubtleBackgroundSelected,
          fontWeight: tokens.fontWeightSemibold,
          padding: "0 2px",
          borderRadius: tokens.borderRadiusSmall,
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

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

export interface ICASOCNT {
  NAACOM: string;
  NANUM: string;
  NANAME: string;
  NAEMAIL?: string;
}

export interface CustomerSearchListProps {
  customers: ICASOCNT[];
  selectedCustomer?: ICASOCNT | null;
  onSelectedChange: (customer: ICASOCNT) => void;
}

export const CustomerSearchList: React.FC<CustomerSearchListProps> = ({
  customers,
  selectedCustomer,
  onSelectedChange,
}) => {
  const [search, setSearch] = React.useState("");

  // 🚀 opóźniona wartość do ciężkiego filtrowania
  const deferredSearch = React.useDeferredValue(search);

  // wynik filtrowania trzymamy w stanie
  const [filtered, setFiltered] = React.useState<ICASOCNT[]>(customers);

  // 🚦 transition – pokażemy spinner kiedy filtrowanie trwa
  const [isPending, startTransition] = React.useTransition();

  // przelicz filtrowaną listę w transition
  React.useEffect(() => {
    startTransition(() => {
      const q = deferredSearch.trim();

      if (!q) {
        setFiltered(customers);
        return;
      }

      const s = q.toLowerCase();

      setFiltered(
        customers.filter(
          (c) =>
            c.NANUM.toLowerCase().includes(s) ||
            c.NANAME.toLowerCase().includes(s)
        )
      );
    });
  }, [customers, deferredSearch]);

  const styles = useStyles();

  // 🔍 pojedynczy wiersz do react-window
  // ---- ROW DLA react-window v2 ----

  const Row = ({ index, style }: RowComponentProps) => {
    const customer = filtered[index];
    const isSelected = customer.NANUM === selectedCustomer?.NANUM;

    const rowClassName = mergeClasses(
      styles.rowBase,
      isSelected && styles.rowSelected
    );

    return (
      <ListItem
        style={{ ...style, width: "100%" }} // ważne: zachowujemy height/top z react-window
        key={customer.NANUM}
        aria-setsize={filtered.length}
        aria-posinset={index + 1}
        className={rowClassName}
        onClick={() => onSelectedChange(customer)}
      >
        <>
          <Persona
            name={customer.NANAME}
            secondaryText={customer.NANUM}
            avatar={{ color: "colorful", "aria-hidden": true }}
          />
        </>
      </ListItem>
    );
  };

  return (
    <>
      <SearchBox
        size="small"
        value={search}
        onChange={(_, data) => setSearch(data.value)}
      />

      {isPending && (
        <div className={styles.spinnerContainer}>
          <Spinner size="tiny" label="Filtering…" />
        </div>
      )}

      <FluentList
        tabIndex={0}
        style={{ width: "100%" }}
        aria-label="Customer search results"
      >
        <VirtualList
          rowComponent={Row}
          rowCount={filtered.length}
          rowHeight={48}
          rowProps={{ customers: filtered }}
          style={{
            height: Math.min(LIST_HEIGHT, filtered.length * ITEM_HEIGHT) + 10,
            width: "100%",
          }}
        ></VirtualList>
      </FluentList>
    </>
  );
};
