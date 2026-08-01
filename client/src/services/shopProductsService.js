import * as shopProductsRepository from '../repositories/shopProductsRepository';
import { getShopCatalogItem } from '../config/shopProductCatalog';

export async function getMyProducts(shopId) {
  return shopProductsRepository.findByShopId(shopId);
}

// items: [{ itemId, name, category, price, availability }]
export async function addProducts(shopId, items) {
  return shopProductsRepository.insertMany(
    items.map((item) => ({
      shopId,
      itemId: item.itemId ?? null,
      category: item.category,
      name: item.name,
      price: item.price,
      availability: item.availability ?? 'In Stock',
    }))
  );
}

export async function updateProduct(id, patch) {
  return shopProductsRepository.update(id, patch);
}

export async function toggleAvailability(id) {
  const product = await shopProductsRepository.findById(id);
  if (!product) return null;
  const next = product.availability === 'In Stock' ? 'Out of Stock' : 'In Stock';
  return shopProductsRepository.update(id, { availability: next });
}

export async function deleteProduct(id) {
  return shopProductsRepository.remove(id);
}

export function resolveCatalogIcon(itemId) {
  return getShopCatalogItem(itemId)?.icon ?? '🛍️';
}
