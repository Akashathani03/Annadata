// Drives CreateListing's per-category behavior. The component reads
// this config instead of hard-coding crop-specific logic, so adding
// 'animal' or 'equipment' later means adding an entry here - the
// CreateListing component, steps, and services stay unchanged.
export const listingFieldConfig = {
  crop: {
    categoryLabelKey: 'navigation:crops.sellCrop',
    itemCatalogCategory: 'crop',
    unitOptions: ['Kg', 'Quintal', 'Ton', 'Bag'],
    defaultQuantity: 100,
    hasApmcStep: true,
    marketPriceRoute: 'market-prices',
  },
  animal: {
    categoryLabelKey: 'navigation:animals.sellAnimal',
    itemCatalogCategory: 'animal',
    unitOptions: ['Head'],
    defaultQuantity: 1,
    hasApmcStep: false,
  },
  equipment: {
    categoryLabelKey: 'navigation:equipment.sellEquipment',
    itemCatalogCategory: 'equipment',
    unitOptions: ['Unit'],
    defaultQuantity: 1,
    hasApmcStep: false,
  },
};

// Bilingual unit labels, keyed by the same ids used in unitOptions above.
// labelKey resolves through the "listings" namespace (en/kn/mix).
export const unitMeta = {
  Kg: { icon: '⚖️', labelKey: 'listings:units.kg' },
  Quintal: { icon: '⚖️', labelKey: 'listings:units.quintal' },
  Ton: { icon: '⚖️', labelKey: 'listings:units.ton' },
  Bag: { icon: '⚖️', labelKey: 'listings:units.bag' },
  Head: { icon: '🐾', labelKey: 'animals:units.head' },
  Unit: { icon: '🔧', labelKey: 'equipment:units.unit' },
};

export function getListingFieldConfig(category) {
  return listingFieldConfig[category];
}
