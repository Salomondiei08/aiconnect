/** Numéro de facture lisible : F-00042. */
export function invoiceNumber(number: number): string {
  return `F-${String(number).padStart(5, "0")}`;
}
