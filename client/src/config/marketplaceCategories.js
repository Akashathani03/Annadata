// Single source of truth for the Home screen tiles and the reusable
// Category Menu. Each entry drives both screens purely through config -
// no per-category component code.
//
// - `hasMenu: false` categories (Schemes, Agro AI) route straight to
//   their existing module and never render the Category Menu.
// - `items` populate the stacked rows inside the Category Menu, in the
//   same generic <CategoryMenu> component for every category.
//
// Adding a future category (e.g. Equipment) = one new object below.
// No component, route pattern, or API change is required.

export const marketplaceCategories = [
  {
    key: 'crops',
    icon: '🌾',
    iconBg: '#e8f5ec',
    labelKey: 'navigation:category.crops',
    descKey: 'navigation:categoryDesc.crops',
    hasMenu: true,
    route: '/crops',
    items: [
      { key: 'marketPrices', icon: '📈', labelKey: 'navigation:crops.marketPrices', route: '/market-prices' },
      { key: 'sellCrop', icon: '🌱', labelKey: 'navigation:crops.sellCrop', route: '/sell', requiresAuth: true },
      { key: 'buyCrop', icon: '🛒', labelKey: 'navigation:crops.buyCrop', route: '/buy' },
    ],
  },
  {
    key: 'animals',
    icon: '🐄',
    iconBg: '#fdeee0',
    labelKey: 'navigation:category.animals',
    descKey: 'navigation:categoryDesc.animals',
    hasMenu: true,
    route: '/animals',
    items: [
      { key: 'sellAnimal', icon: '🐄', labelKey: 'navigation:animals.sellAnimal', route: '/sell-animal', requiresAuth: true },
      { key: 'buyAnimal', icon: '🛒', labelKey: 'navigation:animals.buyAnimal', route: '/buy-animal' },
    ],
  },
  {
    key: 'equipment',
    icon: '🚜',
    iconBg: '#fdf3e0',
    labelKey: 'navigation:category.equipment',
    descKey: 'navigation:categoryDesc.equipment',
    hasMenu: true,
    route: '/equipment',
    items: [
      { key: 'sellEquipment', icon: '🚜', labelKey: 'navigation:equipment.sellEquipment', route: '/sell-equipment', requiresAuth: true },
      { key: 'buyEquipment', icon: '🛒', labelKey: 'navigation:equipment.buyEquipment', route: '/buy-equipment' },
    ],
  },
  {
    key: 'shops',
    icon: '🏬',
    iconBg: '#e6f0fb',
    labelKey: 'navigation:category.shops',
    descKey: 'navigation:categoryDesc.shops',
    hasMenu: true,
    route: '/shops',
    items: [
      { key: 'nearShop', icon: '📍', labelKey: 'navigation:shops.nearShop', route: '/near-shop' },
      { key: 'manageShop', icon: '🏬', labelKey: 'navigation:shops.manageShop', route: '/shop-owner', requiresAuth: true },
    ],
  },
  {
    key: 'schemes',
    icon: '🏛️',
    iconBg: '#ede8fb',
    labelKey: 'navigation:category.schemes',
    descKey: 'navigation:categoryDesc.schemes',
    hasMenu: false,
    route: '/schemes',
    items: [],
  },
  {
    key: 'agroAI',
    icon: '🤖',
    iconBg: '#e0f2f5',
    labelKey: 'navigation:category.agroAI',
    descKey: 'navigation:categoryDesc.agroAI',
    hasMenu: false,
    route: '/agro-ai',
    items: [],
  },
];

export function getCategoryByKey(key) {
  return marketplaceCategories.find((c) => c.key === key);
}
