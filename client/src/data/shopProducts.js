const STORAGE_KEY = 'annadata_shop_products_v1';

function loadShopProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const shopProducts = loadShopProducts();

export function persistShopProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shopProducts));
  } catch {
    // Storage quota or unavailable - fail silently for MVP.
  }
}

let idCounter = 1;
export function nextShopProductId() {
  return `shopprod_${Date.now()}_${idCounter++}`;
}
