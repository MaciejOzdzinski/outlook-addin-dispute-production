// src/lib/http/config.ts
export const apiConfig = {
  tasksBaseUrl: import.meta.env.VITE_API_TASKS,
  salesBaseUrl: import.meta.env.VITE_API_SALES, // np. https://api.company.com/sales
  customersBaseUrl: import.meta.env.VITE_API_CUST, // ...
  productsBaseUrl: import.meta.env.VITE_API_PROD,
} as const;
