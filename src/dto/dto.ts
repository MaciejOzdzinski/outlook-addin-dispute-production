export interface Customer {
  id: number;
  name: string;
  email: string;
}

//CustomerCreate = Omit<Customer, "id">    - do dodawania nowego klienta nie potrzebujemy id
//Omit oznacza „weź typ Customer i usuń z niego wskazane pole”.
export type CustomerCreate = Omit<Customer, "id">;

//CustomerUpdate = Partial<Omit<Customer, "id">>;  - do aktualizacji klienta nie potrzebujemy id i wszystkie pola są opcjonalne
//Omit<Customer, "id"> — znowu usuwamy id
//Partial<...> — zamienia wszystkie pola na opcjonalne
export type CustomerUpdate = Partial<Omit<Customer, "id">>;
