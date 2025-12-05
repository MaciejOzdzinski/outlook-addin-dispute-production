import { HttpClient } from "@/lib/http/httpClient.ts";
import { apiConfig } from "@/lib/http/config.ts";
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
  createdispute: `/createdispute`,
  update: (id: number) => `/customers/${id}`,
  delete: (id: number) => `/customers/${id}`,
  createDispute: `/createdispute`,
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

  getInvoicesByCustomer: (nanum: string) =>
    httpClient.get<ICASOINV>(EndpointsAPI.getInvoicesByCustomer(nanum)),

  createDispute: (data: DisputeFormData): Promise<{ success: boolean }> => {
    // Spłaszczamy formData (format C# .NET):
    const dto = {
      Company: data.customerNumber?.NAACOM,
      CustomerNumber: data.customerNumber?.NANUM,
      DisputeTypeId: data.disputeType?.DTHCOD,
      DisputeHandlerId: data.disputeHandler?.DHECOD,
      InvoiceRefixNumber: data.invoiceNumber?.DTREFX?.toString(),
      ActionDate: data.actionDate
        ? format(data.actionDate, "yyyyMMdd")
        : undefined, // 👈 tylko jeśli data jest

      Priority: data.priority.toString(),
      Description: data.description,

      From: data.from,
      To: data.to,
      Subject: data.subject,
      Body: data.body,

      GraphMessageId: data.graphMessageId,
      DisputeToUpdateId: data?.disputeToUpdate?.DPPID?.toString() || undefined,
      Attachments: data?.attachments,
    };

    //inference
    const result = httpClient.post<boolean>(EndpointsAPI.createdispute, dto);
    return;
  },

  update: (id: number, payload: DisputeFormData) =>
    httpClient.put<DisputeFormData, DisputeFormData>(
      EndpointsAPI.createDispute,
      payload
    ),

  delete: (id: number) => httpClient.delete<void>(EndpointsAPI.delete(id)),
};

export type CashCollectingApiType = typeof CashCollectingApi;
