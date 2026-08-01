import * as salesRepository from '../repositories/salesRepository';

export async function getSales({ ownerId } = {}) {
  return salesRepository.findAll({ ownerId });
}

export async function recordSale(payload) {
  return salesRepository.insert({
    listingId: payload.listingId,
    ownerId: payload.ownerId,
    category: payload.category,
    itemName: payload.itemName,
    quantitySold: payload.quantitySold,
    unit: payload.unit,
    saleAmount: payload.saleAmount,
    buyerName: payload.buyerName,
  });
}
