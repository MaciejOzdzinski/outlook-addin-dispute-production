// ---------- typy ----------
export interface MimeAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // base64
}

export interface MimeInlinePicture {
  name?: string;
  contentType: string;
  contentId: string; // musi odpowiadać cid: w HTML
  contentBytes: string; // base64
}

export interface MimeObject {
  htmlBody: string; // oryginalny HTML z <img src="cid:..."> (podmieniony poniżej)
  subject?: string;
  from?: string;
  to?: string[];
  attachments: MimeAttachment[];
}
