const STORAGE_KEY = 'annadata_shop_sales_v1';

function loadShopSales() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const shopSales = loadShopSales();

export function persistShopSales() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shopSales));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextShopSaleId() {
  return `shopsale_${Date.now()}_${idCounter++}`;
}
