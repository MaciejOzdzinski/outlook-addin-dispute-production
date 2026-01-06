import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Button, Text, makeStyles, Card, Popover, PopoverSurface, Skeleton, SkeletonItem, CompoundButton, Persona, Field, Spinner, tokens, MessageBar, InfoLabel, Textarea, Switch, Toaster, useToastController, ToastTitle, Toast, } from "@fluentui/react-components";
import { priorities, } from "./dto/dto";
import { CustomerSearchList } from "./CustomerSearchList";
import { InvoicesComboBox } from "./InvoicesComboBox";
import Separator from "./Separator";
import { useCommonData } from "@/hooks/useCommonData";
import { useCreateDispute } from "@/hooks/useCreateDispute";
import { useInvoicesByCustomer } from "@/hooks/useInvoicesByCustomer";
import { DisputeTypesCombobox } from "./DisputeTypesComboBox";
import { DisputeHandlersCombobox } from "./DisputeHandlersComboBox";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { PrioritiesCombobox } from "./PrioritiesComboBox";
import { MailRead20Regular } from "@fluentui/react-icons";
import { Collapse } from "@fluentui/react-motion-components-preview";
import { DisputesSingleSelectTable } from "./DisputesSingleSelectTable";
import convertNumberToDate from "./lib/convertNumberToDate";
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
const initialFormData = {
    customerNumber: undefined,
    disputeType: undefined,
    disputeHandler: undefined,
    actionDate: undefined,
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
    const [senderEmail, setSenderEmail] = useState(null);
    // błąd związany z Outlook / odczytem nadawcy
    const [error, setError] = useState(null);
    const [openDisputesDialog, setOpenDisputesDialog] = useState(false);
    const [openCustomersDialog, setOpenCustomersDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedDispute, setSelectedDispute] = useState(undefined);
    // Dane formularza
    const [formData, setFormData] = useState(initialFormData);
    const [selectedPriority, setSelectedPriority] = React.useState(undefined);
    const [visible, setVisible] = React.useState(false);
    // Toast
    const toasterId = useId();
    const { dispatchToast } = useToastController(toasterId);
    const [position, setPosition] = React.useState("bottom-start");
    const notify = () => {
        console.log("Notifying toast...", formData?.disputeToUpdate);
        dispatchToast(_jsx(Toast, { appearance: "inverted", children: _jsxs(ToastTitle, { children: ["Dispute", " ", formData?.disputeToUpdate === undefined ? "created" : "updated"] }) }), { position, intent: "success" });
    };
    const styles = useStyles();
    // ---- HOOK: wspólne dane z API na podstawie e-maila nadawcy ----
    const { data: commonData, loading: commonLoading, error: commonError, reload: reloadCommon, } = useCommonData(senderEmail);
    const { data: invoices } = useInvoicesByCustomer(selectedCustomer?.NANUM);
    // ---- HOOK: tworzenie dispute ----
    const { createDispute, loading: isSaving, error: saveError, } = useCreateDispute();
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
    const handlePopoverOpenChange = React.useCallback((_, data) => {
        setOpenCustomersDialog(data.open);
    }, [setOpenCustomersDialog]);
    // zmiana klienta
    const handleCustomerChange = useCallback((casocnt) => {
        setSelectedCustomer(casocnt);
        //Czyścimy powiązane stany
        setSelectedDispute(undefined);
        //Czyscicmy pozostale zapamietane stany ...
        setSelectedPriority(undefined);
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
    const handleDisputesPopoverOpenChange = React.useCallback((_, data) => {
        setOpenDisputesDialog(data.open);
    }, [setOpenDisputesDialog]);
    const handleDisputeChange = useCallback((casodpd) => {
        setSelectedDispute(casodpd ?? undefined);
    }, []);
    // zmiana faktury
    const handleInvoiceChange = useCallback((casoinv) => {
        setFormData((prev) => ({ ...prev, invoiceNumber: casoinv ?? undefined }));
        setSelectedDispute(undefined);
        if ((casoinv?.DLPIDS ?? []).length > 0) {
            setOpenDisputesDialog(true);
        }
    }, []);
    // zmiana dispute type
    const handleDisputeTypeChange = useCallback((casodpt) => {
        setFormData((prev) => ({ ...prev, disputeType: casodpt ?? undefined }));
    }, []);
    // zmiana dispute handler
    const handleDisputeHandlerChange = useCallback((casodph) => {
        setFormData((prev) => ({ ...prev, disputeHandler: casodph ?? undefined }));
    }, []);
    // zmiana priority
    const handlePriorityChange = useCallback((priority) => {
        setSelectedPriority(priority);
        setFormData((prev) => ({
            ...prev,
            priority: priority?.value ?? undefined,
        }));
    }, []);
    // handler Save – używa hooka useCreateDispute
    const handleSave = React.useCallback(async () => {
        const ok = await createDispute(formData);
        if (ok) {
            // TODO: toast / komunikat sukcesu
            console.log("Dispute utworzony.");
            void notify();
        }
        else {
            // błąd domenowy lub HTTP – szczegóły są w saveError
            console.warn("Dispute not created.");
        }
    }, [createDispute, formData]);
    // walidacja formularza
    const isFormValid = useMemo(() => {
        return Boolean(formData.customerNumber?.NANUM &&
            formData.disputeType?.DTHCOD &&
            formData.disputeHandler?.DHECOD &&
            formData.actionDate instanceof Date &&
            !isNaN(formData.actionDate.getTime()) &&
            (formData.priority ?? 0) > 0 &&
            formData.invoiceNumber?.DTIDNO);
    }, [formData]);
    // ---- Odczyt nadawcy z Outlooka – tylko raz przy montowaniu ----
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                await Office.onReady();
                const item = Office.context.mailbox?.item;
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
                if (cancelled)
                    return;
                setSenderEmail(email);
            }
            catch (error) {
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
    useEffect(() => {
        if (customers.length === 1 && selectedCustomer == null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedCustomer(customers[0]);
            setFormData((f) => ({ ...f, customerNumber: customers[0] }));
        }
        if (customers.length > 1 && selectedCustomer == null) {
            setOpenCustomersDialog(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customers]);
    return (_jsxs(_Fragment, { children: [error && (_jsx(MessageBar, { intent: "error", style: { marginBottom: 8 }, children: error })), commonError && (_jsxs(MessageBar, { intent: "error", style: { marginBottom: 8 }, children: [commonError, _jsx(Button, { size: "small", appearance: "subtle", onClick: reloadCommon, style: { marginLeft: 8 }, children: "Retry" })] })), saveError && (_jsx(MessageBar, { intent: "error", style: { marginBottom: 8 }, children: saveError })), _jsxs(Card, { className: styles.card, children: [_jsx(Text, { className: styles.sectionHeader, children: "Customer" }), _jsxs("div", { children: [_jsxs("div", { children: [commonLoading ? (_jsx(Skeleton, { "aria-label": "Loading Content", children: _jsx(SkeletonItem, { shape: "rectangle", size: 56 }) })) : (_jsx(_Fragment, { children: _jsx(CompoundButton, { size: "medium", style: { width: "100%", justifyContent: "flex-start" }, onClick: () => setOpenCustomersDialog(true), children: _jsx(Persona, { name: formData?.customerNumber?.NANAME, size: "medium", secondaryText: formData?.customerNumber?.NANUM, avatar: selectedCustomer
                                                    ? { color: "colorful", "aria-hidden": true }
                                                    : { "aria-label": "Guest" } }) }) })), _jsx("div", {})] }), _jsxs("div", { style: {
                                    display: "flex",
                                    marginTop: "11px",
                                    gap: "7px",
                                    alignItems: "center",
                                }, children: [_jsx(MailRead20Regular, {}), _jsx(Text, { size: 200, className: "text-muted-foreground", children: senderEmail })] })] }), _jsx(Popover, { open: openCustomersDialog, onOpenChange: handlePopoverOpenChange, children: _jsxs(PopoverSurface, { tabIndex: -1, children: [_jsx(Field, { label: "Search customer", children: _jsx(CustomerSearchList, { customers: customers, selectedCustomer: selectedCustomer, onSelectedChange: handleCustomerChange }) }), _jsx("div", { style: { height: "25px" } }), _jsx("div", { style: {
                                        display: "flex",
                                        gap: "5px",
                                        justifyContent: "flex-end",
                                    }, children: _jsx(Button, { size: "small", onClick: handlePopoverOpenChange.bind(undefined, {}, { open: false }), children: "Close" }) })] }) })] }), _jsx(Separator, { height: 10 }), _jsxs(Card, { className: styles.card, children: [_jsx(Text, { className: styles.sectionHeader, children: "Dispute Details" }), _jsx(InvoicesComboBox, { error: commonError ?? "", isLoading: commonLoading, invoices: invoicesA, selectedInvoice: formData.invoiceNumber ?? null, onSelectedChange: handleInvoiceChange }, `inv-${selectedCustomer?.NANUM ?? "none"}`), _jsx(Popover, { open: openDisputesDialog, onOpenChange: handleDisputesPopoverOpenChange, children: _jsxs(PopoverSurface, { tabIndex: -1, children: [(formData.invoiceNumber?.DLPIDS ?? []).length > 0 && (_jsxs("div", { children: [_jsx(Text, { size: 300, children: "Select dispute:" }), _jsx("div", { style: { marginBottom: "10px" } }), _jsx(DisputesSingleSelectTable, { items: formData?.invoiceNumber?.DLPIDS ?? [], onSelectionChange: handleDisputeChange, selectedDispute: selectedDispute })] })), _jsxs("div", { style: {
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: "5px",
                                        marginTop: "10px",
                                    }, children: [_jsx(Button, { disabled: !selectedDispute, size: "small", onClick: () => {
                                                //Wyczysc formData i ustaw nowe dane
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    disputeToUpdate: selectedDispute,
                                                    disputeHandler: disputeHandlers.find((p) => p.DHECOD.trim() === selectedDispute?.DPDHND.trim()),
                                                    disputeType: disputeTypes.find((r) => r.DTHCOD.trim() === selectedDispute?.DPHCOD.trim()),
                                                    description: selectedDispute?.DPMSGD,
                                                    priority: selectedDispute?.DPPRIO,
                                                    actionDate: convertNumberToDate(selectedDispute?.DPADAT ?? undefined),
                                                }));
                                                setSelectedPriority(priorities.find((p) => p.value === selectedDispute?.DPPRIO) || undefined);
                                                setOpenDisputesDialog(false);
                                            }, children: "Apply" }), _jsx(Button, { size: "small", onClick: () => {
                                                setSelectedDispute(undefined);
                                                setFormData((f) => ({ ...f, disputeToUpdate: undefined }));
                                                setOpenDisputesDialog(false);
                                            }, children: "Close" })] })] }) }), _jsx(DisputeTypesCombobox, { error: commonError ?? "", isLoading: commonLoading, disputeTypes: disputeTypes, selectedDisputeType: formData.disputeType ?? null, onSelectedChange: handleDisputeTypeChange }, `dtype-${selectedCustomer?.NANUM ?? "none"}`), _jsx(DisputeHandlersCombobox, { error: commonError ?? "", isLoading: commonLoading, disputeHandlers: disputeHandlers, selectedDisputeHandler: formData.disputeHandler ?? null, onSelectedChange: handleDisputeHandlerChange }, `dhandler-${selectedCustomer?.NANUM ?? "none"}`), _jsxs("div", { style: {
                            display: "flex",
                            gap: "10px",
                        }, children: [_jsx(Field, { size: "small", style: { flex: 1 }, label: _jsx(InfoLabel, { info: "Example info", size: "small", children: "Action Date" }), required: true, validationState: error ? "error" : "none", validationMessage: error || "", children: _jsx(DatePicker, { style: { minWidth: "unset", width: "100%", maxWidth: "100%" }, input: { style: { width: "100%" } }, size: "small", allowTextInput: true, placeholder: "Select a date...", value: formData.actionDate, onSelectDate: (date) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            actionDate: date ?? undefined,
                                        }));
                                    } }, `dpicker-${selectedCustomer?.NANUM ?? "none"}`) }), _jsx(PrioritiesCombobox, { priorities: priorities, selectedPriority: selectedPriority, onSelectedChange: handlePriorityChange, isLoading: false, error: "", containerStyle: { flex: 1 } }, `prio-${selectedCustomer?.NANUM ?? "none"}`)] })] }), _jsx(Separator, { height: 10 }), _jsxs(Card, { className: styles.card, children: [_jsxs("div", { style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }, children: [_jsx(Text, { className: styles.sectionHeader, children: "Description" }), _jsx(Switch, { className: styles.smallSwitch, checked: visible, onChange: () => setVisible((v) => !v) })] }), _jsx(Collapse, { visible: visible, children: _jsx(Field, { size: "small", children: _jsx(Textarea, { size: "small", rows: 10, resize: "vertical", appearance: "outline", onChange: (_, data) => {
                                    setFormData((f) => ({
                                        ...f,
                                        description: data.value ?? undefined,
                                    }));
                                }, value: formData.description, placeholder: "Describe the dispute in detail..." }, `text-${selectedCustomer?.NANUM ?? "none"}`) }) })] }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "15px" }, children: _jsxs("div", { className: styles.buttonContainer, children: [_jsx(Button, { appearance: "primary", disabled: isSaving || !isFormValid, size: "small", icon: isSaving ? _jsx(Spinner, { size: "extra-tiny" }) : null, onClick: handleSave, children: isSaving ? "Saving..." : "Save" }), _jsx(Toaster, { toasterId: toasterId })] }) })] }));
};
export default App;
