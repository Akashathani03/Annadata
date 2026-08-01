import * as shopSalesRepository from '../repositories/shopSalesRepository';

export async function getTodaySales(shopId) {
  const all = await shopSalesRepository.findByShopId(shopId);
  const today = new Date().toDateString();
  return all.filter((s) => new Date(s.soldAt).toDateString() === today);
}

export async function recordSale({ shopId, productId, productName, quantity }) {
  return shopSalesRepository.insert({ shopId, productId, productName, quantity });
}
