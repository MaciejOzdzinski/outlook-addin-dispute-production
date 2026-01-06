const convertNumberToDate = (dateNumber: number | undefined): Date => {
  const dateString = dateNumber?.toString();

  if (dateString?.length !== 8) {
    throw new Error("Nieprawidłowy format daty. Oczekiwano formatu RRRRMMDD");
  }

  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Miesiące są 0-indeksowane
  const day = parseInt(dateString.substring(6, 8));

  return new Date(year, month, day);
};

export default convertNumberToDate;
