import { users, nextUserId, persistUsers } from '../data/users';

export async function findByPhone(phone) {
  return users.find((u) => u.phone === phone) ?? null;
}

export async function findById(id) {
  return users.find((u) => u.id === id) ?? null;
}

export async function insert(userInput) {
  const now = Date.now();
  const user = {
    id: nextUserId(),
    name: '',
    phone: '',
    whatsapp: '',
    village: '',
    taluk: '',
    district: '',
    state: '',
    location: '',
    lat: null,
    lng: null,
    language: 'mix',
    locationSkipped: false,
    createdAt: now,
    updatedAt: now,
    ...userInput,
  };
  users.push(user);
  persistUsers();
  return user;
}

export async function update(id, patch) {
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...patch, updatedAt: Date.now() };
  persistUsers();
  return users[index];
}

// Looks up a user by phone, creating a new one if none exists yet.
// Returns { user, isNewUser } so callers (authService) know whether to
// run onboarding (name/location) or skip straight to Home.
export async function findOrCreateByPhone(phone, extra = {}) {
  const existing = await findByPhone(phone);
  if (existing) return { user: existing, isNewUser: false };
  const created = await insert({ phone, ...extra });
  return { user: created, isNewUser: true };
}
