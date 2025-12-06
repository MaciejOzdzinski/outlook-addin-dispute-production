/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Text,
  makeStyles,
  Card,
  Popover,
  PopoverSurface,
  Skeleton,
  SkeletonItem,
  CompoundButton,
  Persona,
  Avatar,
  Field,
  Spinner,
  tokens,
  MessageBar,
  InfoLabel,
  Textarea,
  Switch,
} from "@fluentui/react-components";

import {
  priorities,
  type DisputeFormData,
  type ICASOCNT,
  type ICASODPH,
  type ICASODPT,
  type ICASOINV,
} from "./dto/dto";
import { CustomerSearchList } from "./CustomerSearchList";
import { InvoicesComboBox } from "./InvoicesComboBox";
import Separator from "./Separator";
import { useCommonData } from "@/hooks/useCommonData";
import { useCreateDispute } from "@/hooks/useCreateDispute";
import { useInvoicesByCustomer } from "@/hooks/useInvoicesByCustomer";
import { DisputeTypesCombobox } from "./DisputeTypesComboBox";
import { DisputeHandlersCombobox } from "./DisputeHandlersComboBox";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { PrioritiesCombobox, type PriorityOption } from "./PrioritiesComboBox";
import { Mail20Regular, MailRead20Regular } from "@fluentui/react-icons";
import { Collapse } from "@fluentui/react-motion-components-preview";

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

  smallSwitch: {
    transform: "scale(0.85)",
    transformOrigin: "left center",
  },

  instructions: {
    fontWeight: tokens.fontWeightSemibold,
    marginTop: "20px",
    marginBottom: "10px",
  },
  textPromptAndInsertion: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  textAreaField: {
    marginTop: "30px",
    marginBottom: "20px",
    marginRight: "20px",
    maxWidth: "100%",
  },
  buttonc1: {
    width: "300px",
  },
  buttonContainer: {
    position: "fixed",
    right: "15px",
    bottom: "15px",
  },

  listbox: {
    maxHeight: "250px",
  },
  option: {
    height: "12px",
  },
});

// initial form data
const initialFormData: DisputeFormData = {
  customerNumber: undefined,
  disputeType: undefined,
  disputeHandler: undefined,
  actionDate: new Date(),
  priority: 0,
  description: "",
  invoiceNumber: undefined,

  from: "",
  to: "",
  subject: "",
  body: "",

  disputeToUpdate: undefined,

  graphMessageId: "",

  attachments: undefined,
};

export const App = () => {
  const [senderEmail, setSenderEmail] = useState<string | null>(null);

  // błąd związany z Outlook / odczytem nadawcy
  const [error, setError] = useState<string | null>(null);

  const [openDisputesDialog, setOpenDisputesDialog] = useState<boolean>(false);
  const [openCustomersDialog, setOpenCustomersDialog] =
    useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<ICASOCNT | null>(
    null
  );

  const [formData, setFormData] = useState<DisputeFormData>(initialFormData);
  const [selectedPriority, setSelectedPriority] =
    React.useState<PriorityOption | null>(null);

  const [visible, setVisible] = React.useState<boolean>(false);
  const styles = useStyles();

  // ---- HOOK: wspólne dane z API na podstawie e-maila nadawcy ----
  const {
    data: commonData,
    loading: commonLoading,
    error: commonError,
    reload: reloadCommon,
  } = useCommonData(senderEmail);

  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
    reload: reloadInvoices,
  } = useInvoicesByCustomer(selectedCustomer?.NANUM);

  // ---- HOOK: tworzenie dispute ----
  const {
    createDispute,
    loading: isSaving,
    error: saveError,
  } = useCreateDispute();

  //Stabilizacja referencji tablic [] ze wzgledu na zapis: ?? []
  const customers = React.useMemo(() => {
    return commonData?.CASOCNT ?? [];
  }, [commonData]);

  const disputeTypes = React.useMemo(() => {
    return commonData?.CASODPT ?? [];
  }, [commonData]);

  const disputeHandlers = React.useMemo(() => {
    return commonData?.CASODPH ?? [];
  }, [commonData]);

  const invoicesA = React.useMemo(() => {
    return invoices ?? [];
  }, [invoices]);

  //Handlery

  const handlePopoverOpenChange = React.useCallback(
    (_: unknown, data: { open: boolean }) => {
      setOpenCustomersDialog(data.open);
    },
    [setOpenCustomersDialog]
  );

  // zmiana klienta
  const handleCustomerChange = useCallback((casocnt: ICASOCNT | null) => {
    setSelectedCustomer(casocnt);

    //Czyscicmy pozostale zapamietane stany ...
    setSelectedPriority(null);
    setFormData((prev) => ({
      ...prev,
      customerNumber: casocnt ?? undefined,
      invoiceNumber: undefined, // bo invoice już nie pasuje
      disputeType: undefined,
      disputeHandler: undefined,
      actionDate: undefined,
      description: undefined,
      priority: undefined,
    }));
    setOpenCustomersDialog(false);
  }, []);

  // zmiana faktury
  const handleInvoiceChange = useCallback((casoinv: ICASOINV | null) => {
    setFormData((prev) => ({ ...prev, invoiceNumber: casoinv ?? undefined }));
  }, []);

  // zmiana dispute type
  const handleDisputeTypeChange = useCallback((casodpt: ICASODPT | null) => {
    setFormData((prev) => ({ ...prev, disputeType: casodpt ?? undefined }));
  }, []);

  // zmiana dispute handler
  const handleDisputeHandlerChange = useCallback((casodph: ICASODPH | null) => {
    setFormData((prev) => ({ ...prev, disputeHandler: casodph ?? undefined }));
  }, []);

  // zmiana priority
  const handlePriorityChange = useCallback(
    (priority: PriorityOption | null) => {
      setSelectedPriority(priority);
      setFormData((prev) => ({
        ...prev,
        priority: priority?.value ?? undefined,
      }));
    },
    []
  );

  // handler Save – używa hooka useCreateDispute
  const handleSave = React.useCallback(async () => {
    const ok = await createDispute(formData);
    if (ok) {
      // TODO: toast / komunikat sukcesu
      console.log("Dispute utworzony.");
    } else {
      // błąd domenowy lub HTTP – szczegóły są w saveError
      console.warn("Dispute not created.");
    }
  }, [createDispute, formData]);

  // walidacja formularza
  const isFormValid = useMemo(() => {
    return Boolean(
      formData.customerNumber?.NANUM &&
        formData.disputeType?.DTHCOD &&
        formData.disputeHandler?.DHECOD &&
        formData.actionDate instanceof Date &&
        !isNaN(formData.actionDate.getTime()) &&
        formData.priority > 0 &&
        formData.invoiceNumber?.DTIDNO
    );
  }, [formData]);

  // ---- Odczyt nadawcy z Outlooka – tylko raz przy montowaniu ----
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await Office.onReady();

        const item = Office.context.mailbox?.item as
          | Office.MessageRead
          | undefined;

        if (!item || !item.from) {
          if (!cancelled) {
            setError("Cannot access current message or sender.");
          }
          return;
        }

        const email = item.from.emailAddress;
        if (!email) {
          if (!cancelled) {
            setError("Sender email address not found.");
          }
          return;
        }

        if (cancelled) return;

        setSenderEmail(email);
      } catch (error) {
        console.error("Error while reading email:", error);
        if (!cancelled) {
          setError("Unexpected error while reading email.");
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Błąd Outlooka (brak wiadomości / nadawcy) */}
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 8 }}>
          {error}
        </MessageBar>
      )}

      {/* Błąd wspólnych danych z API */}
      {commonError && (
        <MessageBar intent="error" style={{ marginBottom: 8 }}>
          {commonError}
          <Button
            size="small"
            appearance="subtle"
            onClick={reloadCommon}
            style={{ marginLeft: 8 }}
          >
            Retry
          </Button>
        </MessageBar>
      )}

      {/* Błąd zapisu dispute */}
      {saveError && (
        <MessageBar intent="error" style={{ marginBottom: 8 }}>
          {saveError}
        </MessageBar>
      )}

      <Card className={styles.card}>
        <Text className={styles.sectionHeader}>Customer</Text>
        <div>
          <div>
            {commonLoading ? (
              <Skeleton aria-label="Loading Content">
                <SkeletonItem shape="rectangle" size={56} />
              </Skeleton>
            ) : (
              <>
                <CompoundButton
                  size="medium"
                  style={{ width: "100%", justifyContent: "flex-start" }}
                  onClick={() => setOpenCustomersDialog(true)}
                >
                  <Persona
                    name={formData?.customerNumber?.NANAME}
                    size="medium"
                    secondaryText={formData?.customerNumber?.NANUM}
                    avatar={
                      selectedCustomer
                        ? { color: "colorful", "aria-hidden": true }
                        : { "aria-label": "Guest" }
                    }
                  />
                </CompoundButton>
              </>
            )}

            <div></div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "11px",

              gap: "7px",
              alignItems: "center",
            }}
          >
            <MailRead20Regular />
            <Text size={200} className="text-muted-foreground">
              {senderEmail}
            </Text>
          </div>
        </div>

        <Popover
          open={openCustomersDialog}
          onOpenChange={handlePopoverOpenChange}
        >
          <PopoverSurface tabIndex={-1}>
            <Field label="Search customer">
              <CustomerSearchList
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelectedChange={handleCustomerChange}
              />
            </Field>

            <div style={{ height: "25px" }} />

            <div
              style={{
                display: "flex",
                gap: "5px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                size="small"
                onClick={handlePopoverOpenChange.bind(
                  undefined,
                  {},
                  { open: false }
                )}
              >
                Close
              </Button>
            </div>
          </PopoverSurface>
        </Popover>
      </Card>

      <Separator height={10} />

      <Card className={styles.card}>
        <Text className={styles.sectionHeader}>Dispute Details</Text>
        <InvoicesComboBox
          key={`inv-${selectedCustomer?.NANUM ?? "none"}`}
          error={commonError ?? ""}
          isLoading={commonLoading}
          invoices={invoicesA}
          selectedInvoice={formData.invoiceNumber ?? null}
          onSelectedChange={handleInvoiceChange}
        />

        <DisputeTypesCombobox
          key={`dtype-${selectedCustomer?.NANUM ?? "none"}`}
          error={commonError ?? ""}
          isLoading={commonLoading}
          disputeTypes={disputeTypes}
          selectedDisputeType={formData.disputeType ?? null}
          onSelectedChange={handleDisputeTypeChange}
        />

        <DisputeHandlersCombobox
          key={`dhandler-${selectedCustomer?.NANUM ?? "none"}`}
          error={commonError ?? ""}
          isLoading={commonLoading}
          disputeHandlers={disputeHandlers}
          selectedDisputeHandler={formData.disputeHandler ?? null}
          onSelectedChange={handleDisputeHandlerChange}
        />

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <Field
            size="small"
            style={{ flex: 1 }}
            label={
              <InfoLabel info="Example info" size="small">
                Action Date
              </InfoLabel>
            }
            required
            validationState={error ? "error" : "none"}
            validationMessage={error || ""}
          >
            <DatePicker
              key={`dpicker-${selectedCustomer?.NANUM ?? "none"}`}
              style={{ minWidth: "unset", width: "100%", maxWidth: "100%" }}
              input={{ style: { width: "100%" } }}
              size="small"
              allowTextInput
              placeholder="Select a date..."
              value={formData.actionDate}
              onSelectDate={(date) => {
                setFormData((prev) => ({
                  ...prev,
                  actionDate: date ?? new Date(), // albo date ?? new Date() jeśli chcesz mieć zawsze Date
                }));
              }}
            />
          </Field>

          <PrioritiesCombobox
            key={`prio-${selectedCustomer?.NANUM ?? "none"}`}
            priorities={priorities}
            selectedPriority={selectedPriority}
            onSelectedChange={handlePriorityChange}
            isLoading={false}
            error=""
            containerStyle={{ flex: 1 }} // 👈 TERAZ SAM KOMPONENT JEST FLEX ITEM
          />
        </div>
      </Card>
      <Separator height={10} />
      <Card className={styles.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text className={styles.sectionHeader}>Description</Text>

          <Switch
            className={styles.smallSwitch}
            checked={visible}
            onChange={() => setVisible((v) => !v)}
          />
        </div>

        <Collapse visible={visible}>
          <Field size="small">
            <Textarea
              key={`text-${selectedCustomer?.NANUM ?? "none"}`}
              size="small"
              rows={10}
              resize="vertical"
              appearance="outline"
              onChange={(_, data) => {
                setFormData((f) => ({
                  ...f,
                  description: data.value ?? undefined,
                }));
              }}
              value={formData.description}
              placeholder="Describe the dispute in detail..."
            />
          </Field>
        </Collapse>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div className={styles.buttonContainer}>
          <Button
            appearance="primary"
            disabled={isSaving || !isFormValid}
            size="small"
            icon={isSaving ? <Spinner size="extra-tiny" /> : null}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default App;
