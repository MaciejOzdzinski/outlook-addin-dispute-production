import { HttpClient } from "@/lib/http/httpClient";
import { apiConfig } from "@/lib/http/config";
import { getAccessToken, refreshToken } from "@/lib/http/auth";
import type {
  DisputeFormData,
  ICASOINV,
  ICommonDataResponse,
} from "@/dto/dto.ts";
import { format } from "date-fns";

/** Endpoints API */
const EndpointsAPI = {
  getCommonData: (email: string) =>
    `/getcommondata?email=${encodeURIComponent(email)}`,
  getInvoicesByCustomer: (nanum: string) =>
    `/getinvoicesbycustomer?customer=${encodeURIComponent(nanum)}`,
  createDispute: `/createdispute`,
  update: (id: number) => `/disputes/${id}`,
  delete: (id: number) => `/disputes/${id}`,
} as const;

/** Lokalny klient HTTP dla domeny customers */
const httpClient = new HttpClient({
  baseUrl: apiConfig.customersBaseUrl,
  getAccessToken,
  refreshToken,
  timeoutMs: 12000,
  retry: { attempts: 3, backoffMs: 400 },
  defaultHeaders: { Accept: "application/json" },
  //credentials: "include",
});

/** "SDK" dla klientów – proste CRUD na HttpClient */
export const CashCollectingApi = {
  getCommonData: (email: string): Promise<ICommonDataResponse> =>
    httpClient.get<ICommonDataResponse>(EndpointsAPI.getCommonData(email)),

  getInvoicesByCustomer: (nanum: string): Promise<ICASOINV> =>
    httpClient.get<ICASOINV>(EndpointsAPI.getInvoicesByCustomer(nanum)),

  createDispute: (data: DisputeFormData): Promise<{ success: boolean }> => {
    // Spłaszczamy formData (format C# .NET):
    console.log("CREATE Dispute input data:", data);

    const dto = {
      Company: data.customerNumber?.NAACOM,
      CustomerNumber: data.customerNumber?.NANUM,
      DisputeTypeId: data.disputeType?.DTHCOD,
      DisputeHandlerId: data.disputeHandler?.DHECOD,
      InvoiceRefixNumber: data.invoiceNumber?.DTREFX?.toString(),
      ActionDate: data.actionDate
        ? format(data.actionDate, "yyyyMMdd")
        : undefined, // 👈 tylko jeśli data jest

      Priority: data.priority != null ? String(data.priority) : undefined,
      Description: data.description,

      From: data.from,
      To: data.to,
      Subject: data.subject,
      EmlBase64: data.EmlBase64,

      GraphMessageId: data.graphMessageId,
      DisputeToUpdateId: data?.disputeToUpdate?.DPPID?.toString() || undefined,
      Attachments: data?.attachments,
      RecievedDate: data.recievedDate
        ? format(data.recievedDate, "yyyyMMdd")
        : undefined,
    };

    console.log("CREATE Dispute DTO to send:", dto);

    const result = httpClient.post<{ success: boolean }>(
      EndpointsAPI.createDispute,
      dto
    );
    return result;
  },

  update: (
    id: number,
    payload: DisputeFormData
  ): Promise<{ success: boolean }> => {
    console.log("UPDATE Dispute DTO to send:", payload);
    return httpClient.put<{ success: boolean }, unknown>(
      EndpointsAPI.update(id),
      payload as unknown
    );
  },

  delete: (id: number): Promise<void> =>
    httpClient.delete<void>(EndpointsAPI.delete(id)),
};

export type CashCollectingApiType = typeof CashCollectingApi;
