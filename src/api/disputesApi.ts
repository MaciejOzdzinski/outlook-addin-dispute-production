import { HttpClient } from "@/lib/http/httpClient.ts";
import { apiConfig } from "@/lib/http/config.ts";
import { getAccessToken, refreshToken } from "@/lib/http/auth";
import type { Customer, CustomerCreate, CustomerUpdate } from "@/dto/dto.ts";

/** Endpoints API */
const EndpointsAPI = {
  list: "/customers",
  byId: (id: number) => `/customers/${id}`,
  create: "/customers",
  update: (id: number) => `/customers/${id}`,
  delete: (id: number) => `/customers/${id}`,
} as const;

/** Lokalny klient HTTP dla domeny customers */
const client = new HttpClient({
  baseUrl: apiConfig.customersBaseUrl,
  getAccessToken,
  refreshToken,
  timeoutMs: 12000,
  retry: { attempts: 3, backoffMs: 400 },
  defaultHeaders: { Accept: "application/json" },
  credentials: "include",
});

/** "SDK" dla klientów – proste CRUD na HttpClient */
export const CustomersApi = {
  getAll: () => client.get<Customer[]>(EndpointsAPI.list),

  getById: (id: number) => client.get<Customer>(EndpointsAPI.byId(id)),

  create: (payload: CustomerCreate) =>
    client.post<Customer, CustomerCreate>(EndpointsAPI.create, payload),

  update: (id: number, payload: CustomerUpdate) =>
    client.put<Customer, CustomerUpdate>(EndpointsAPI.update(id), payload),

  delete: (id: number) => client.delete<void>(EndpointsAPI.delete(id)),
};

export type CustomersApiType = typeof CustomersApi;
