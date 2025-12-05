import * as React from "react";
import { CashCollectingApi } from "@/api/CashCollectingApi";
import type { ICASOINV } from "@/dto/dto";
import { HttpError } from "@/lib/http/httpClient";
import { generateMockInvoicesForCustomer } from "@/api/mockInvoices";

export interface UseInvoicesByCustomerResult {
  data: ICASOINV[] | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Ładuje faktury dla danego klienta (NANUM).
 */
export const useInvoicesByCustomer = (
  nanum: string | null | undefined
): UseInvoicesByCustomerResult => {
  const [data, setData] = React.useState<ICASOINV[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      // const resp = await CashCollectingApi.getInvoicesByCustomer(nanum);

      const resp = generateMockInvoicesForCustomer(nanum, 20);

      // tu zakładam, że odpowiedź to tablica; jeśli nie – dopasuj:
      const invoices = Array.isArray(resp) ? resp : [resp];
      setData(invoices);
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        console.error(
          "getInvoicesByCustomer HttpError:",
          err.status,
          err.problem
        );

        setError(
          err.problem?.detail ||
            err.problem?.title ||
            `Server error (${err.status})`
        );

        if (err.response) {
          const raw = await err.response.text().catch(() => "");
          console.debug("getInvoicesByCustomer RAW RESPONSE:", raw);
        }
      } else {
        console.error("getInvoicesByCustomer unexpected error:", err);
        setError("Unexpected error while loading invoices.");
      }
    } finally {
      setLoading(false);
    }
  }, [nanum]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) return;
      await fetchData();
    };

    if (nanum) {
      void run();
    } else {
      setData(null);
      setError("Customer number (NANUM) not provided.");
    }

    return () => {
      cancelled = true;
    };
  }, [nanum, fetchData]);

  return {
    data,
    loading,
    error,
    reload: fetchData,
  };
};
