import * as shopsRepository from '../repositories/shopsRepository';

export async function getMyShop(ownerId) {
  return shopsRepository.findByOwnerId(ownerId);
}

export async function getShopById(id) {
  return shopsRepository.findById(id);
}

// A shop is "active" (visible in Near Shop) once the required fields
// are filled - matches the prototype's Incomplete -> Active status pill.
export async function saveShop(ownerId, patch) {
  const isComplete = !!(patch.shopName && patch.ownerName && patch.phone && patch.whatsapp && patch.location);
  return shopsRepository.upsertByOwnerId(ownerId, {
    ...patch,
    status: isComplete ? 'active' : 'incomplete',
  });
}
