import { sales, nextSaleId } from '../data/sales';

export async function findAll({ ownerId } = {}) {
  return sales.filter((s) => !ownerId || s.ownerId === ownerId);
}

export async function insert(saleInput) {
  const sale = {
    id: nextSaleId(),
    soldAt: Date.now(),
    ...saleInput,
  };
  sales.unshift(sale);
  return sale;
}
