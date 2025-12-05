/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import type { DisputeFormData } from "@/dto/dto";
import { CashCollectingApi } from "@/api/CashCollectingApi";
import { HttpError } from "@/lib/http/httpClient";
import { getMimeObjectFromOutlookItem } from "@/api/mime";

export interface UseCreateDisputeResult {
  createDispute: (data: DisputeFormData) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook odpowiedzialny za utworzenie dispute:
 * - czyta aktualną wiadomość z Outlooka (Office.js)
 * - pobiera MIME (HTML + attachments)
 * - buduje payload DisputeFormData
 * - wywołuje CashCollectingApi.createDispute
 * - zarządza loading/error
 */
export const useCreateDispute = (): UseCreateDisputeResult => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createDispute = React.useCallback(
    async (data: DisputeFormData): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        await Office.onReady();

        const item = Office.context.mailbox?.item as
          | Office.MessageRead
          | undefined;

        if (!item) {
          setError("Cannot access current message (Outlook item not found).");
          return false;
        }

        const message = item;

        // 1. Pobierz EWS ID
        const ewsId: string = message.itemId;

        // 2. Konwersja na REST v2.0 ID (Graph)
        const restId: string = Office.context.mailbox.convertToRestId(
          ewsId,
          Office.MailboxEnums.RestVersion.v2_0
        );

        // 3. MIME (HTML + inline + attachments)
        const mimeObj = await getMimeObjectFromOutlookItem(message);

        // 4. Payload do API – nadpisujemy pola mailowe danymi z Outlooka
        const payload: DisputeFormData = {
          ...data,
          from: message.from?.emailAddress ?? "",
          to: message.to?.[0]?.emailAddress ?? "",
          subject: message.subject ?? "",
          body: mimeObj.htmlBody ?? "",
          graphMessageId: restId,
          attachments: mimeObj.attachments ?? [],
        };

        const ok = await CashCollectingApi.createDispute(payload);

        if (!ok) {
          setError("Dispute was not created (API returned false).");
        }

        return ok;
      } catch (err: unknown) {
        if (err instanceof HttpError) {
          console.error("createDispute HttpError:", err.status, err.problem);

          setError(
            err.problem?.detail ||
              err.problem?.title ||
              `Server error (${err.status})`
          );

          if (err.response) {
            try {
              const raw = await err.response.text();
              console.debug("createDispute RAW RESPONSE:", raw);
            } catch {
              /* ignore */
            }
          }
        } else {
          console.error("createDispute unexpected error:", err);
          setError("Unexpected error while creating dispute.");
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createDispute, loading, error };
};
