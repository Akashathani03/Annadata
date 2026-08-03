import { ShopProduct } from '../models/ShopProduct.js';

export async function findByShopId(shopId) {
  return ShopProduct.find({ shopId });
}

export async function findById(id) {
  return ShopProduct.findById(id);
}

export async function findAll({ category } = {}) {
  return ShopProduct.find(category ? { category } : {});
}

export async function insertMany(items) {
  return ShopProduct.insertMany(items);
}

export async function update(id, patch) {
  return ShopProduct.findByIdAndUpdate(id, { $set: patch }, { new: true });
}

export async function remove(id) {
  const result = await ShopProduct.findByIdAndDelete(id);
  return result !== null;
}
