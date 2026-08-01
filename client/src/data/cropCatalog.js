// `group` matches the prototype's BC_CATS classification (cereal/veg/
// fruit/pulse/oilseed/spice) - used by Buy Crops' category filter.
// Separate from `category` ('crop' vs future 'animal'), which is the
// top-level marketplace category, not the crop sub-classification.
export const cropCatalog = [
  { id: 'tomato', category: 'crop', group: 'veg', name: 'Tomato', kannadaName: 'ಟೊಮ್ಯಾಟೊ', icon: '🍅', defaultUnit: 'Kg' },
  { id: 'onion', category: 'crop', group: 'veg', name: 'Onion', kannadaName: 'ಈರುಳ್ಳಿ', icon: '🧅', defaultUnit: 'Kg' },
  { id: 'paddy', category: 'crop', group: 'cereal', name: 'Paddy', kannadaName: 'ಭತ್ತ', icon: '🌾', defaultUnit: 'Quintal' },
  { id: 'maize', category: 'crop', group: 'cereal', name: 'Maize', kannadaName: 'ಮೆಕ್ಕೆಜೋಳ', icon: '🌽', defaultUnit: 'Quintal' },
  { id: 'ragi', category: 'crop', group: 'cereal', name: 'Ragi', kannadaName: 'ರಾಗಿ', icon: '🌾', defaultUnit: 'Quintal' },
  { id: 'groundnut', category: 'crop', group: 'oilseed', name: 'Groundnut', kannadaName: 'ಶೇಂಗಾ', icon: '🥜', defaultUnit: 'Quintal' },
  { id: 'chilli', category: 'crop', group: 'spice', name: 'Chilli', kannadaName: 'ಮೆಣಸಿನಕಾಯಿ', icon: '🌶️', defaultUnit: 'Kg' },
  { id: 'brinjal', category: 'crop', group: 'veg', name: 'Brinjal', kannadaName: 'ಬದನೆಕಾಯಿ', icon: '🍆', defaultUnit: 'Kg' },
];

export function getCropById(cropId) {
  return cropCatalog.find((c) => c.id === cropId);
}
