// Same shape as cropCatalog.js on purpose - Create Listing's Category
// step and Market Prices-style catalog lookups work identically for
// both, no component changes needed for the new category.
export const animalCategories = [
  { id: 'cattle', icon: '🐄', labelKey: 'animals:categories.cattle' },
  { id: 'buffalo', icon: '🐃', labelKey: 'animals:categories.buffalo' },
  { id: 'goat', icon: '🐐', labelKey: 'animals:categories.goat' },
  { id: 'sheep', icon: '🐑', labelKey: 'animals:categories.sheep' },
  { id: 'poultry', icon: '🐔', labelKey: 'animals:categories.poultry' },
];

export const animalCatalog = [
  { id: 'cow', category: 'animal', group: 'cattle', name: 'Cow', kannadaName: 'ಹಸು', icon: '🐄', defaultUnit: 'Head' },
  { id: 'bull', category: 'animal', group: 'cattle', name: 'Bull', kannadaName: 'ಎತ್ತು', icon: '🐂', defaultUnit: 'Head' },
  { id: 'calf', category: 'animal', group: 'cattle', name: 'Calf', kannadaName: 'ಕರು', icon: '🐮', defaultUnit: 'Head' },
  { id: 'buffalo', category: 'animal', group: 'buffalo', name: 'Buffalo', kannadaName: 'ಎಮ್ಮೆ', icon: '🐃', defaultUnit: 'Head' },
  { id: 'goat', category: 'animal', group: 'goat', name: 'Goat', kannadaName: 'ಮೇಕೆ', icon: '🐐', defaultUnit: 'Head' },
  { id: 'sheep', category: 'animal', group: 'sheep', name: 'Sheep', kannadaName: 'ಕುರಿ', icon: '🐑', defaultUnit: 'Head' },
  { id: 'hen', category: 'animal', group: 'poultry', name: 'Hen', kannadaName: 'ಕೋಳಿ', icon: '🐔', defaultUnit: 'Head' },
  { id: 'duck', category: 'animal', group: 'poultry', name: 'Duck', kannadaName: 'ಬಾತುಕೋಳಿ', icon: '🦆', defaultUnit: 'Head' },

  // Kept identical (same ids) to server/scripts/seed-animal-catalog.js.
  { id: 'heifer', category: 'animal', group: 'cattle', name: 'Heifer', kannadaName: 'ಕಿರಿ ಹಸು', icon: '🐄', defaultUnit: 'Head' },
  { id: 'buffalo_calf', category: 'animal', group: 'buffalo', name: 'Buffalo Calf', kannadaName: 'ಎಮ್ಮೆ ಕರು', icon: '🐃', defaultUnit: 'Head' },
  { id: 'goat_kid', category: 'animal', group: 'goat', name: 'Goat Kid', kannadaName: 'ಮೇಕೆ ಮರಿ', icon: '🐐', defaultUnit: 'Head' },
  { id: 'lamb', category: 'animal', group: 'sheep', name: 'Lamb', kannadaName: 'ಕುರಿ ಮರಿ', icon: '🐑', defaultUnit: 'Head' },
  { id: 'rooster', category: 'animal', group: 'poultry', name: 'Rooster', kannadaName: 'ಹುಂಜ', icon: '🐓', defaultUnit: 'Head' },
  { id: 'turkey', category: 'animal', group: 'poultry', name: 'Turkey', kannadaName: 'ಟರ್ಕಿ ಕೋಳಿ', icon: '🦃', defaultUnit: 'Head' },
];

export function getAnimalById(animalId) {
  return animalCatalog.find((a) => a.id === animalId);
}

export function getAnimalsByCategory(categoryId) {
  return animalCatalog.filter((a) => a.group === categoryId);
}
