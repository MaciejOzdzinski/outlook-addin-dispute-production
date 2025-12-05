import type { ICASOINV, ICASODPD } from "@/dto/dto";

// pomocnicze funkcje
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDocType = () => {
  const types = ["INV", "CRN", "DBN", "CN1", "IN2"];
  return types[rand(0, types.length - 1)];
};

const randomText = () => {
  const samples = [
    "Late payment",
    "Price discrepancy",
    "Quantity mismatch",
    "Contract dispute",
    "Damaged goods",
  ];
  return samples[rand(0, samples.length - 1)];
};

// generator pozycji sporu (ICASODPD)
function generateRandomDisputePositions(count: number): ICASODPD[] {
  return Array.from({ length: count }).map((_, i) => ({
    DPPID: rand(10000, 99999),
    DPHCOD: `H${rand(1, 5).toString().padStart(3, "0")}`, // handler
    DPSCOD: `S${rand(1, 5).toString().padStart(3, "0")}`, // status
    DPDHND: "AUTO",
    DPPRIO: rand(1, 5),
    DPCRDT: rand(50, 5000), // amount
    DPMSGD: randomText(),
    DPMSGA: randomText(),
    DPADAT: Number(
      new Date(2024, rand(0, 11), rand(1, 28))
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")
    ),
  }));
}

// generator faktur ICASOINV
export function generateMockInvoicesForCustomer(
  customerNumber: string,
  count = 15
): ICASOINV[] {
  return Array.from({ length: count }).map(() => {
    const refix = rand(100000, 999999);
    const type = randomDocType();

    return {
      DTACOM: "01", // company code
      DTREFX: refix,
      DTDOTY: type,
      DTIDNO: rand(10000, 99999),
      DTTTXT: randomText(),
      DLPIDS: generateRandomDisputePositions(rand(1, 3)), // 1–3 dispute lines
    };
  });
}
