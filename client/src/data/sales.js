// Shape mirrors the approved `sales` schema:
// { listing: ref(Listing), seller, quantitySold, saleAmount, buyerName, soldAt }
export const sales = [];

let idCounter = 1;
export function nextSaleId() {
  return `sale_${Date.now()}_${idCounter++}`;
}
