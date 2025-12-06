// App.tsx (nowy layout – tylko przykład, podmień swój JSX)
// -------------------------------------------------------
import * as React from "react";
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Field,
  InfoLabel,
  Persona,
  Spinner,
  Text,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";

// Twoje istniejące komponenty:
import { InvoicesComboBox } from "./InvoicesComboBox";
import { DisputeTypesCombobox } from "./DisputeTypesCombobox";
import { DisputeHandlersCombobox } from "./DisputeHandlersCombobox";
import { PrioritiesCombobox } from "./PrioritiesCombobox";

// DTO itp. – przykładowe importy:
import type {
  DisputeFormData,
  ICASOCNT,
  ICASOINV,
  ICASODPT,
  ICASODPH,
} from "./dto/dto";
import type { PriorityOption } from "./PrioritiesCombobox";

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    maxWidth: "420px",
    margin: "0 auto",
  },

  card: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },

  sectionHeader: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
  },

  customerHeaderCard: {
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: tokens.spacingVerticalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },

  customerRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },

  customerPersona: {
    flex: 1,
  },

  mailRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))", // 2 równe kolumny
    columnGap: tokens.spacingHorizontalM, // odstęp między kolumnami
    rowGap: tokens.spacingVerticalM, // odstęp między wierszami
    alignItems: "start",
  },

  gridItem: {
    width: "100%",
    boxSizing: "border-box",
  },

  fullRow: {
    gridColumn: "1 / -1",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: tokens.spacingVerticalM,
  },

  saveButton: {
    minWidth: "96px",
  },
});

// -------------------------------------------------------
// Główny komponent – przykład z nowym layoutem
// -------------------------------------------------------

export const App2: React.FC = () => {
  const styles = useStyles();

  // ⬇⬇⬇ ZAKŁADAM, że masz to już u siebie – to tylko przykładowe sygnatury
  const [senderEmail] = React.useState<string | null>("piotr.popek@clarior.be");
  const [selectedCustomer] = React.useState<ICASOCNT | null>(null);
  const [formData, setFormData] = React.useState<DisputeFormData>({
    customerNumber: undefined,
    disputeType: undefined,
    disputeHandler: undefined,
    invoiceNumber: undefined,
    actionDate: undefined,
    priority: 0,
    description: "",
  });
  const [selectedInvoice, setSelectedInvoice] = React.useState<ICASOINV | null>(
    null
  );
  const [selectedDisputeType, setSelectedDisputeType] =
    React.useState<ICASODPT | null>(null);
  const [selectedDisputeHandler, setSelectedDisputeHandler] =
    React.useState<ICASODPH | null>(null);
  const [selectedPriority, setSelectedPriority] =
    React.useState<PriorityOption | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Te dane normalnie bierzesz z useCommonData/CashCollectingApi:
  const invoices: ICASOINV[] = []; // TODO: podłącz swoje dane
  const disputeTypes: ICASODPT[] = [];
  const disputeHandlers: ICASODPH[] = [];
  const priorities: PriorityOption[] = [
    { value: 1, label: "Critical", color: "severe" },
    { value: 2, label: "High", color: "danger" },
    { value: 3, label: "Medium", color: "warning" },
    { value: 4, label: "Low", color: "success" },
  ];

  const isFormValid = Boolean(
    formData.customerNumber &&
      formData.invoiceNumber &&
      formData.disputeType &&
      formData.disputeHandler &&
      formData.actionDate &&
      selectedPriority
  );

  // Handlery – u Ciebie już istnieją, to tylko przykłady
  const handleInvoiceChange = (inv: ICASOINV | null) => {
    setSelectedInvoice(inv);
    setFormData((prev) => ({ ...prev, invoiceNumber: inv ?? undefined }));
  };

  const handleDisputeTypeChange = (t: ICASODPT | null) => {
    setSelectedDisputeType(t);
    setFormData((prev) => ({ ...prev, disputeType: t ?? undefined }));
  };

  const handleDisputeHandlerChange = (h: ICASODPH | null) => {
    setSelectedDisputeHandler(h);
    setFormData((prev) => ({ ...prev, disputeHandler: h ?? undefined }));
  };

  const handlePriorityChange = (p: PriorityOption | null) => {
    setSelectedPriority(p);
    setFormData((prev) => ({
      ...prev,
      priority: p?.value ?? 0,
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // TODO: wywołanie Save (createDispute)
    } catch (e: any) {
      setError(e?.message ?? "Error while saving dispute.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.root}>
      {/* ======================================================
        CARD 1 — CUSTOMER CONTEXT
    ======================================================= */}
      <Card className={styles.card}>
        <Text className={styles.sectionHeader}>Customer</Text>

        <div className={styles.customerHeaderCard}>
          <div className={styles.customerRow}>
            {selectedCustomer ? (
              <Persona
                className={styles.customerPersona}
                name={selectedCustomer.NANAME}
                secondaryText={selectedCustomer.NANUM}
                presence={{ status: "available" }}
                avatar={{ color: "colorful", "aria-hidden": true }}
                size="large"
              />
            ) : (
              <>
                <Avatar size={32} />
                <Text>Choose customer…</Text>
              </>
            )}
          </div>

          {senderEmail && (
            <div className={styles.mailRow}>
              <Avatar size={20} />
              <span>{senderEmail}</span>
            </div>
          )}
        </div>
      </Card>

      <div style={{ height: "12px" }} />

      {/* ======================================================
        CARD 2 — DISPUTE DETAILS
    ======================================================= */}
      <Card className={styles.card}>
        <Text className={styles.sectionHeader}>Dispute Details</Text>

        <div className={styles.formGrid}>
          {/* Invoice + Dispute type */}
          <div className={styles.gridItem}>
            <InvoicesComboBox
              invoices={invoices}
              selectedInvoice={selectedInvoice}
              onSelectedChange={handleInvoiceChange}
              isLoading={isLoading}
              error={error ?? ""}
            />
          </div>

          <div className={styles.gridItem}>
            <DisputeTypesCombobox
              disputeTypes={disputeTypes}
              selectedDisputeType={selectedDisputeType}
              onSelectedChange={handleDisputeTypeChange}
              isLoading={isLoading}
              error={error ?? ""}
            />
          </div>

          {/* Date + Priority */}

          <div className={styles.gridItem}>
            <Field
              size="small"
              label={
                <InfoLabel info="Planned action date" size="small">
                  Action Date
                </InfoLabel>
              }
              required
            >
              <DatePicker
                size="small"
                allowTextInput
                placeholder="Select a date..."
                value={formData.actionDate}
                onSelectDate={(date) =>
                  setFormData((prev) => ({
                    ...prev,
                    actionDate: date ?? undefined,
                  }))
                }
              />
            </Field>
          </div>

          <div className={styles.gridItem}>
            <PrioritiesCombobox
              priorities={priorities}
              selectedPriority={selectedPriority}
              onSelectedChange={handlePriorityChange}
              isLoading={isLoading}
              error={error ?? ""}
            />
          </div>

          {/* Handler  */}
          <div className={mergeClasses(styles.gridItem, styles.fullRow)}>
            <div>
              <DisputeHandlersCombobox
                disputeHandlers={disputeHandlers}
                selectedDisputeHandler={selectedDisputeHandler}
                onSelectedChange={handleDisputeHandlerChange}
                isLoading={isLoading}
                error={error ?? ""}
              />
            </div>
          </div>
        </div>
      </Card>

      <div style={{ height: "12px" }} />

      {/* ======================================================
        CARD 3 — DESCRIPTION
    ======================================================= */}
      <Card className={styles.card}>
        <Text className={styles.sectionHeader}>Description</Text>

        <Field
          size="small"
          label={
            <InfoLabel info="Describe the dispute clearly" size="small">
              Description
            </InfoLabel>
          }
        >
          <Textarea
            resize="vertical"
            placeholder="Describe the dispute in detail…"
            value={formData.description ?? ""}
            onChange={(ev, data) =>
              setFormData((prev) => ({ ...prev, description: data.value }))
            }
            style={{ minHeight: 120 }}
          />
        </Field>

        <div className={styles.footer}>
          <Button
            appearance="primary"
            disabled={isLoading || !isFormValid}
            icon={isLoading ? <Spinner size="tiny" /> : undefined}
            onClick={handleSave}
            className={styles.saveButton}
          >
            {isLoading ? "Saving…" : "Save"}
          </Button>
        </div>
      </Card>
    </main>
  );
};

export default App2;
