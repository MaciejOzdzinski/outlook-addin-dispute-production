// losowy integer
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
// kilka przykładowych nazw
const firstNames = ["Adam", "Ewa", "Kamil", "Ola", "Robert", "Marta"];
const lastNames = ["Kowalski", "Nowak", "Wiśniewski", "Lewandowska"];
const disputeTypes = ["PRICE", "DATE", "QTY", "PAYMNT", "DAMG"];
const handlerNames = ["John Handler", "Kate Manager", "Lucas Admin"];
// tworzy losowego klienta ICASOCNT
function createCustomer(id) {
    const name = firstNames[rand(0, firstNames.length - 1)] +
        " " +
        lastNames[rand(0, lastNames.length - 1)];
    return {
        NAACOM: "01",
        NANUM: id.toString().padStart(6, "0"),
        NANAME: name,
    };
}
// tworzy losowy typ sporu ICASODPT
function createDisputeType(id) {
    return {
        DTHCOD: id.toString().padStart(3, "0"),
        DTHDES: disputeTypes[rand(0, disputeTypes.length - 1)],
    };
}
// tworzy handlera ICASODPH
function createDisputeHandler(id) {
    return {
        DHECOD: `H${id.toString().padStart(3, "0")}`,
        DHEDES: handlerNames[rand(0, handlerNames.length - 1)],
        DHHSQL: "",
        DHEMAI: `handler${id}@test.com`,
        DHEPHO: "+48 600 000 000",
    };
}
// FULL MOCK
export function generateMockCommonData() {
    const customers = Array.from({ length: 15 }).map((_, i) => createCustomer(i + 1));
    const disputeTypes = Array.from({ length: 5 }).map((_, i) => createDisputeType(i + 1));
    const disputeHandlers = Array.from({ length: 25 }).map((_, i) => createDisputeHandler(i + 1));
    return {
        CASOCNT: customers,
        CASODPT: disputeTypes,
        CASODPH: disputeHandlers,
    };
}
