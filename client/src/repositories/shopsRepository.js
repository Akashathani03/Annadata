import { shops, nextShopId, persistShops } from '../data/shops';

export async function findByOwnerId(ownerId) {
  return shops.find((s) => s.ownerId === ownerId) ?? null;
}

export async function findById(id) {
  return shops.find((s) => s.id === id) ?? null;
}

export async function findAll() {
  return shops.filter((s) => s.status === 'active');
}

export async function upsertByOwnerId(ownerId, patch) {
  const existing = shops.find((s) => s.ownerId === ownerId);
  if (existing) {
    Object.assign(existing, patch, { updatedAt: Date.now() });
    persistShops();
    return existing;
  }
  const now = Date.now();
  const shop = {
    id: nextShopId(),
    ownerId,
    shopName: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    location: '',
    address: '',
    photoUrl: '',
    lat: null,
    lng: null,
    status: 'incomplete',
    views: 0,
    createdAt: now,
    updatedAt: now,
    ...patch,
  };
  shops.push(shop);
  persistShops();
  return shop;
}
