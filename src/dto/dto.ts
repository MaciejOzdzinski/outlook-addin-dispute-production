import { MimeAttachment } from "./mimeobjects";

// src/models/api.ts
export interface ICASOCNT {
  NAACOM: string;
  NANUM: string;
  NANAME: string;
}

export interface ICASODPH {
  DHECOD: string;
  DHEDES: string;
  DHHSQL: string;
  DHEMAI: string;
  DHEPHO: string;
}

export interface ICASODPT {
  DTHCOD: string;
  DTHDES: string;
}

// Typ zwracany przez API
export interface ICommonDataResponse {
  CASOCNT: ICASOCNT[];
  CASODPH: ICASODPH[];
  CASODPT: ICASODPT[];
}

export interface ICASODPD {
  DPPID: number;
  DPHCOD: string;
  DPSCOD: string;
  DPDHND: string;
  DPPRIO: number;
  DPCRDT: number;
  DPMSGD?: string; // jeśli w bazie może być null
  DPMSGA?: string; // jeśli w bazie może być null
  DPADAT: number;
  DTHDES?: string;
  DHEDES?: string;
}

export interface ICASOINV {
  DTACOM: string;
  DTREFX: number;
  DTDOTY: string;
  DTIDNO: number;
  DTTTXT: string;
  DLPIDS?: ICASODPD[];
}

export interface DisputeFormData {
  customerNumber?: ICASOCNT;
  disputeType?: ICASODPT;
  disputeHandler?: ICASODPH;
  invoiceNumber?: ICASOINV;
  actionDate?: Date | undefined;
  priority: number | undefined;
  description?: string;
  from?: string;
  to?: string;
  subject?: string;
  EmlBase64?: string;
  //body?: string;
  disputeToUpdate?: ICASODPD;
  graphMessageId?: string;
  attachments?: MimeAttachment[];
  recievedDate?: Date;
}

export const priorities = [
  { value: 4, label: "Low", color: "success" },
  { value: 3, label: "Medium", color: "warning" },
  { value: 2, label: "High", color: "danger" },
  { value: 1, label: "Critical", color: "severe" },
];
