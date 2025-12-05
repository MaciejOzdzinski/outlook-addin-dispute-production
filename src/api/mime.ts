import type {
  MimeAttachment,
  MimeInlinePicture,
  MimeObject,
} from "@/dto/mimeobjects";

// ---------- główna funkcja zbierająca dane ----------
export async function getMimeObjectFromOutlookItem(
  item: Office.MessageRead | Office.AppointmentRead
): Promise<MimeObject> {
  // 1. HTML
  const originalHtml: string = await new Promise((resolve, reject) => {
    item.body.getAsync(Office.CoercionType.Html, (res) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res.value);
      else reject(res.error);
    });
  });

  // 2. Subject / From / To
  const subject: string = (item as any).subject || "";
  const from: string = (item as any).from?.emailAddress || "";
  const to: string[] = ((item as any).to || []).map(
    (r: any) => r.emailAddress || ""
  );

  // 3. Wyciągnij wszystkie cid: z HTML (w kolejności)
  const cidMatches: string[] = Array.from(
    originalHtml.matchAll(/<img[^>]+src=(["'])cid:([^"'>]+)\1/gi)
  ).map((m) => m[2]);

  // 4. Załączniki
  const inlinePictures: MimeInlinePicture[] = [];
  const attachments: MimeAttachment[] = [];

  const attList: any[] = (item as any).attachments || [];
  // filtrujemy inline osobno, żeby móc mapować po kolei
  const inlineAtts = attList.filter((a) => a.isInline);
  let cidIndex = 0;

  for (const att of attList) {
    const contentResult: Office.AsyncResult<any> = await new Promise(
      (resolve, reject) => {
        item.getAttachmentContentAsync(att.id, (res) => {
          if (res.status === Office.AsyncResultStatus.Succeeded) resolve(res);
          else reject(res.error);
        });
      }
    );

    const val = contentResult.value;
    if (!val) continue;

    const contentTypeFromAtt: string =
      (att as any).contentType || inferMimeTypeFromName(att.name);

    if (att.isInline) {
      // ustal contentId: najpierw z att.contentId, potem z HTML, w ostateczności generuj
      let contentId = att.contentId;
      if (!contentId) {
        if (cidIndex < cidMatches.length) {
          contentId = cidMatches[cidIndex];
        } else {
          contentId = generateContentId();
        }
        cidIndex++;
      }

      inlinePictures.push({
        name: att.name,
        contentType: contentTypeFromAtt,
        contentId,
        contentBytes: val.content, // base64
      });
    } else {
      attachments.push({
        name: att.name,
        contentType: contentTypeFromAtt,
        contentBytes: val.content, // base64
      });
    }
  }

  // 5. Podmienienie obrazków inline w HTML na data-uri (opcjonalnie)
  let processedHtml = originalHtml;
  for (const pic of inlinePictures) {
    const cidPattern = new RegExp(
      `src=(["'])cid:${escapeRegExp(pic.contentId)}\\1`,
      "gi"
    );
    const dataUri = `src="data:${pic.contentType};base64,${pic.contentBytes}"`;
    processedHtml = processedHtml.replace(cidPattern, dataUri);
  }

  return {
    htmlBody: processedHtml,
    subject,
    from,
    to,
    attachments,
  };
}

// helper: prosty generator (fallback) jeśli potrzebujesz unikalnego CID
function generateContentId(): string {
  return `${crypto.randomUUID()}@local`; // np. "uuid@local"
}

// ucieczka regexowa
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- pomocniczka do MIME jeśli brakuje contentType ----------
function inferMimeTypeFromName(name: string = ""): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "xls":
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "txt":
      return "text/plain";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
