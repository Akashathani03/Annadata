import { shopSales, nextShopSaleId, persistShopSales } from '../data/shopSales';

export async function findByShopId(shopId) {
  return shopSales.filter((s) => s.shopId === shopId);
}

export async function insert(saleInput) {
  const sale = { id: nextShopSaleId(), soldAt: Date.now(), ...saleInput };
  shopSales.unshift(sale);
  persistShopSales();
  return sale;
}
