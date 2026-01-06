import * as React from "react";
import { CashCollectingApi } from "@/api/CashCollectingApi.ts";
import { HttpError } from "@/lib/http/httpClient";
/**
 * Ładuje dane wspólne (np. customers, disputeTypes, disputeHandlers)
 * na podstawie adresu e-mail (nadawcy wiadomości).
 */
export const useCommonData = (email) => {
    const [data, setData] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const fetchData = React.useCallback(async () => {
        if (!email) {
            setData(null);
            setError("Sender email address not provided.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const resp = await CashCollectingApi.getCommonData(email);
            //const resp = generateMockCommonData();
            // symulacja opóźnienia backendu
            // await new Promise((r) => setTimeout(r, 800));
            setData(resp);
        }
        catch (err) {
            if (err instanceof HttpError) {
                console.error("getCommonData HttpError:", err.status, err.problem);
                setError(err.problem?.detail ||
                    err.problem?.title ||
                    `Server error (${err.status})`);
                if (err.response) {
                    // opcjonalnie zajrzyj w RAW body
                    const raw = await err.response.text().catch(() => "");
                    console.debug("getCommonData RAW RESPONSE:", raw);
                }
            }
            else {
                console.error("getCommonData unexpected error:", err);
                setError("Unexpected error while loading common data.");
            }
        }
        finally {
            setLoading(false);
        }
    }, [email]);
    React.useEffect(() => {
        let cancelled = false;
        const run = async () => {
            if (cancelled)
                return;
            await fetchData();
        };
        if (email) {
            void run();
        }
        else {
            setData(null);
            setError("Sender email address not provided.");
        }
        return () => {
            cancelled = true;
        };
    }, [email]);
    return {
        data,
        loading,
        error,
        reload: fetchData,
    };
};
