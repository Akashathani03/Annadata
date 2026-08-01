import * as profileRepository from '../repositories/profileRepository';

export async function getProfile() {
  return profileRepository.find();
}

export async function updateProfile({ name, phone, whatsapp, village, taluk, district }) {
  const location = [village, taluk, district].filter(Boolean).join(', ') || 'Mandya, Karnataka';
  return profileRepository.update({
    name: name || 'Farmer',
    phone,
    whatsapp: whatsapp || phone,
    village,
    taluk,
    district,
    location,
  });
}
