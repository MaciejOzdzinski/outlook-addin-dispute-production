import * as React from "react";
import { CashCollectingApi } from "@/api/CashCollectingApi";
import { HttpError } from "@/lib/http/httpClient";
/**
 * Ładuje faktury dla danego klienta (NANUM).
 */
export const useInvoicesByCustomer = (nanum) => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const fetchData = React.useCallback(async () => {
        if (!nanum) {
            setData(null);
            setError("Customer number (NANUM) not provided.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // jeśli API zwraca pojedynczą fakturę, zmień typ na ICASOINV
            const resp = await CashCollectingApi.getInvoicesByCustomer(nanum);
            //const resp = generateMockInvoicesForCustomer(nanum, 20);
            // tu zakładam, że odpowiedź to tablica; jeśli nie – dopasuj:
            const invoices = Array.isArray(resp) ? resp : [resp];
            setData(invoices);
        }
        catch (err) {
            if (err instanceof HttpError) {
                console.error("getInvoicesByCustomer HttpError:", err.status, err.problem);
                setError(err.problem?.detail ||
                    err.problem?.title ||
                    `Server error (${err.status})`);
                if (err.response) {
                    const raw = await err.response.text().catch(() => "");
                    console.debug("getInvoicesByCustomer RAW RESPONSE:", raw);
                }
            }
            else {
                console.error("getInvoicesByCustomer unexpected error:", err);
                setError("Unexpected error while loading invoices.");
            }
        }
        finally {
            setLoading(false);
        }
    }, [nanum]);
    React.useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (cancelled)
                return;
            await fetchData();
        };
        if (nanum) {
            void run();
        }
        else {
            setData(null);
            setError("Customer number (NANUM) not provided.");
        }
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nanum]);
    return {
        data,
        loading,
        error,
        reload: fetchData,
    };
};
