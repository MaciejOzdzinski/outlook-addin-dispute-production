import * as React from "react";
import {
  Combobox,
  Field,
  InfoLabel,
  makeStyles,
  mergeClasses,
  Option,
  Skeleton,
  SkeletonItem,
  tokens,
  useId,
  type ComboboxProps,
} from "@fluentui/react-components";
import { List as VirtualList, type RowComponentProps } from "react-window";
import { startTransition } from "react";
import { DocumentText20Regular } from "@fluentui/react-icons";
import { highlightMatch } from "./lib/HighlightMatch";

const ITEM_HEIGHT = 42;
const LIST_HEIGHT = 500;

const useStyles = makeStyles({
  comboFullWidth: {
    minWidth: "unset",
    width: "100%",
    maxWidth: "100%",
  },

  inputFullWidth: {
    width: "100%",
  },

  listRoot: {
    height: "360px",
    overflowX: "hidden",
  },

  rowBase: {
    boxSizing: "border-box",
    width: "100%",
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

  iconWrapper: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },

  textContainer: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
  },

  titleLine: {
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    fontWeight: tokens.fontWeightSemibold,
  },

  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },
});

export type DocumentOption = {
  /** Stabilny identyfikator, używany jako Option.value */
  id: string;
  /** Tekst główny widoczny w liście i w input po wyborze */
  title: string;
  /** Opcjonalny tekst pomocniczy (np. typ/źródło/krótki opis) */
  subtitle?: string;
};

export type DocumentsComboboxProps = {
  documents: DocumentOption[];
  selectedDocument: DocumentOption | null;
  onSelectedChange: (doc: DocumentOption | null) => void;
  isLoading: boolean;
  error: string;
};

const formatDocumentLabel = (doc: DocumentOption): string => {
  return doc.subtitle ? `${doc.title} — ${doc.subtitle}` : doc.title;
};

export const DocumentsCombobox = React.memo(
  ({
    documents,
    selectedDocument,
    onSelectedChange,
    isLoading = false,
    error,
  }: DocumentsComboboxProps) => {
    const labelId = useId();
    const styles = useStyles();

    const selectedOptionValue = selectedDocument
      ? selectedDocument.id
      : undefined;

    const [search, setSearch] = React.useState<string>("");
    const [isTyping, setIsTyping] = React.useState(false);
    const deferredSearch = React.useDeferredValue(search);

    const [filteredDocuments, setFilteredDocuments] =
      React.useState<DocumentOption[]>(documents);

    React.useEffect(() => {
      setFilteredDocuments(documents);
    }, [documents]);

    React.useEffect(() => {
      startTransition(() => {
        const q = deferredSearch.trim();

        if (!q) {
          setFilteredDocuments(documents);
          return;
        }

        const s = q.toLowerCase();

        setFilteredDocuments(
          documents.filter((d) => {
            const haystack = `${d.id} ${d.title} ${
              d.subtitle ?? ""
            }`.toLowerCase();
            return haystack.includes(s);
          })
        );
      });
    }, [documents, deferredSearch]);

    React.useEffect(() => {
      if (isTyping) return;

      if (!selectedDocument) {
        setSearch("");
        return;
      }

      setSearch(formatDocumentLabel(selectedDocument));
    }, [selectedDocument, isTyping]);

    const onOptionSelect: ComboboxProps["onOptionSelect"] = (_, data) => {
      const id = data.optionValue ? data.optionValue : null;
      const found = id
        ? filteredDocuments.find((d) => d.id === id) ?? null
        : null;

      onSelectedChange(found);
      setIsTyping(false);

      if (!found) {
        setSearch("");
        return;
      }

      setSearch(formatDocumentLabel(found));
    };

    const Row = ({ index, style }: RowComponentProps) => {
      const doc = filteredDocuments[index];

      const primaryText = formatDocumentLabel(doc);
      const highlighted = highlightMatch(primaryText, deferredSearch);

      const isSelected = selectedDocument?.id === doc.id;

      return (
        <div style={style}>
          <Option
            className={mergeClasses(
              styles.rowBase,
              isSelected ? styles.rowSelected : undefined
            )}
            key={doc.id}
            value={doc.id}
            text={primaryText}
          >
            <div className={styles.iconWrapper}>
              <DocumentText20Regular />
            </div>

            <div className={styles.textContainer}>
              <span className={styles.titleLine}>{highlighted}</span>
              {doc.subtitle ? (
                <span className={styles.subtitle}>{doc.subtitle}</span>
              ) : null}
            </div>
          </Option>
        </div>
      );
    };

    return (
      <Field
        size="small"
        label={
          <span id={labelId}>
            <InfoLabel info="Select a document" size="small">
              Document
            </InfoLabel>
          </span>
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
            aria-labelledby={labelId}
            placeholder="Enter document"
            value={search}
            onChange={(ev) => {
              setIsTyping(true);
              setSearch(ev.target.value);
              onSelectedChange(null);
            }}
            onOptionSelect={onOptionSelect}
            onOpenChange={(_, data) => {
              if (data.open) {
                setFilteredDocuments(documents);
                setIsTyping(false);
              }
            }}
            selectedOptions={selectedOptionValue ? [selectedOptionValue] : []}
            className={styles.comboFullWidth}
            input={{ className: styles.inputFullWidth }}
          >
            <VirtualList
              className={styles.listRoot}
              rowComponent={Row}
              rowCount={filteredDocuments.length}
              rowHeight={ITEM_HEIGHT}
              rowProps={{ documents: filteredDocuments }}
              style={{
                height: Math.min(
                  LIST_HEIGHT,
                  filteredDocuments.length * ITEM_HEIGHT + 10
                ),
                width: "100%",
              }}
            />
          </Combobox>
        )}
      </Field>
    );
  }
);

DocumentsCombobox.displayName = "DocumentsCombobox";
