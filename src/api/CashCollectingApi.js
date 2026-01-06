import { HttpClient } from "@/lib/http/httpClient.ts";
import { apiConfig } from "@/lib/http/config.ts";
import { getAccessToken, refreshToken } from "@/lib/http/auth";
import { format } from "date-fns";
/** Endpoints API */
const EndpointsAPI = {
    getCommonData: (email) => `/getcommondata?email=${encodeURIComponent(email)}`,
    getInvoicesByCustomer: (nanum) => `/getinvoicesbycustomer?customer=${encodeURIComponent(nanum)}`,
    createdispute: `/createdispute`,
    update: (id) => `/customers/${id}`,
    delete: (id) => `/customers/${id}`,
    createDispute: `/createdispute`,
};
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
    getCommonData: (email) => httpClient.get(EndpointsAPI.getCommonData(email)),
    getInvoicesByCustomer: (nanum) => httpClient.get(EndpointsAPI.getInvoicesByCustomer(nanum)),
    createDispute: (data) => {
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
            RecievedDate: data.recievedDate
                ? format(data.recievedDate, "yyyyMMdd")
                : undefined,
        };
        //inference
        const result = httpClient.post(EndpointsAPI.createdispute, dto);
        return result;
    },
    update: (id, payload) => httpClient.put(EndpointsAPI.createDispute, payload),
    delete: (id) => httpClient.delete(EndpointsAPI.delete(id)),
};
