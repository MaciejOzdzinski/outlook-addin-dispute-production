// src/lib/mime.ts
export function getEmlBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const item = Office.context.mailbox.item;

    console.log("Getting EML from item:", item?.getAsFileAsync);

    if (!item?.getAsFileAsync) {
      reject(new Error("getAsFileAsync not available"));
      return;
    }

    try {
      item.getAsFileAsync((r) => {
        if (r.status === Office.AsyncResultStatus.Succeeded) {
          console.log("getAsFileAsync result:", r);

          resolve(r.value as string);
        } else {
          reject(r.error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}
