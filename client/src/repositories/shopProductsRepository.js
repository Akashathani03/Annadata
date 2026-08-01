import { shopProducts, nextShopProductId, persistShopProducts } from '../data/shopProducts';

export async function findByShopId(shopId) {
  return shopProducts.filter((p) => p.shopId === shopId);
}

export async function findById(id) {
  return shopProducts.find((p) => p.id === id) ?? null;
}

export async function findAll({ category } = {}) {
  return shopProducts.filter((p) => !category || p.category === category);
}

export async function insertMany(items) {
  const now = Date.now();
  const created = items.map((item) => ({
    id: nextShopProductId(),
    availability: 'In Stock',
    createdAt: now,
    updatedAt: now,
    ...item,
  }));
  shopProducts.push(...created);
  persistShopProducts();
  return created;
}

export async function update(id, patch) {
  const index = shopProducts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  shopProducts[index] = { ...shopProducts[index], ...patch, updatedAt: Date.now() };
  persistShopProducts();
  return shopProducts[index];
}

export async function remove(id) {
  const index = shopProducts.findIndex((p) => p.id === id);
  if (index === -1) return false;
  shopProducts.splice(index, 1);
  persistShopProducts();
  return true;
}
