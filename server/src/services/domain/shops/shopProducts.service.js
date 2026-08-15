import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import * as shopProductRepository from '../../../repositories/shopProduct.repository.js';
import * as shopRepository from '../../../repositories/shop.repository.js';

// Same pattern already established in conversation.service.js and
// listings.service.js - a malformed id is an input-validation
// problem, not a "not found" problem, and should never surface as a
// raw, unhandled Mongoose CastError falling through to a generic 500.
function assertValidObjectId(id, fieldName) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${fieldName} is not a valid id.`);
  }
}

// A shop's product list/creation must be scoped to a shop the
// authenticated user actually owns - trusting a client-supplied
// shopId directly (as the original controller design did before this
// check was added) would let any authenticated user read or add
// products to a shop that isn't theirs.
async function assertOwnsShop(userId, shopId) {
  assertValidObjectId(shopId, 'shopId');
  const shop = await shopRepository.findById(shopId);
  if (!shop || shop.ownerId.toString() !== userId) {
    throw new ApiError(404, 'SHOP_NOT_FOUND', 'Shop not found.');
  }
  return shop;
}

export async function getMyProducts(userId, shopId) {
  await assertOwnsShop(userId, shopId);
  return shopProductRepository.findByShopId(shopId);
}

// items: [{ itemId, name, category, price, availability }] - name is
// already resolved from the catalog by the frontend before this is
// ever called (confirmed by inspection), so this never needs to know
// about the static catalog itself.
export async function addProducts(userId, shopId, items) {
  await assertOwnsShop(userId, shopId);
  return shopProductRepository.insertMany(
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

// A product mutation must belong to a shop the authenticated user
// actually owns - the mock data had no equivalent check (no real
// cross-user attack surface existed), but a real backend genuinely
// needs this, same "does this user own this resource" principle
// already established for Agro AI's Session/Message ownership checks.
async function assertOwnsProduct(userId, productId) {
  assertValidObjectId(productId, 'id');
  const product = await shopProductRepository.findById(productId);
  if (!product) {
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }
  const shop = await shopRepository.findById(product.shopId);
  if (!shop || shop.ownerId.toString() !== userId) {
    // 404, not 403 - never confirm another owner's product even exists.
    throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  }
  return product;
}

export async function updateProduct(userId, id, patch) {
  await assertOwnsProduct(userId, id);
  return shopProductRepository.update(id, patch);
}

export async function toggleAvailability(userId, id) {
  const product = await assertOwnsProduct(userId, id);
  const next = product.availability === 'In Stock' ? 'Out of Stock' : 'In Stock';
  return shopProductRepository.update(id, { availability: next });
}

export async function deleteProduct(userId, id) {
  await assertOwnsProduct(userId, id);
  return shopProductRepository.remove(id);
}
