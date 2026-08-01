export const shopProductCategories = [
  { id: 'seeds', icon: '🌱', labelKey: 'shops:categories.seeds' },
  { id: 'fertilizers', icon: '🧪', labelKey: 'shops:categories.fertilizers' },
  { id: 'protection', icon: '🧴', labelKey: 'shops:categories.protection' },
  { id: 'tools', icon: '🛠️', labelKey: 'shops:categories.tools' },
  { id: 'others', icon: '📦', labelKey: 'shops:categories.others' },
];

export const shopProductCatalog = [
  { id: 'tomato_seed', category: 'seeds', name: 'Tomato Seeds', kannadaName: 'ಟೊಮ್ಯಾಟೊ ಬೀಜ', icon: '🍅' },
  { id: 'onion_seed', category: 'seeds', name: 'Onion Seeds', kannadaName: 'ಈರುಳ್ಳಿ ಬೀಜ', icon: '🧅' },
  { id: 'paddy_seed', category: 'seeds', name: 'Paddy Seeds', kannadaName: 'ಭತ್ತದ ಬೀಜ', icon: '🌾' },
  { id: 'maize_seed', category: 'seeds', name: 'Maize Seeds', kannadaName: 'ಮೆಕ್ಕೆಜೋಳ ಬೀಜ', icon: '🌽' },
  { id: 'urea', category: 'fertilizers', name: 'Urea', kannadaName: 'ಯೂರಿಯಾ', icon: '🧪' },
  { id: 'dap', category: 'fertilizers', name: 'DAP', kannadaName: 'ಡಿಎಪಿ', icon: '🧪' },
  { id: 'npk', category: 'fertilizers', name: 'NPK Complex', kannadaName: 'ಎನ್‌ಪಿಕೆ', icon: '🧪' },
  { id: 'vermicompost', category: 'fertilizers', name: 'Vermicompost', kannadaName: 'ಎರೆಹುಳು ಗೊಬ್ಬರ', icon: '🧪' },
  { id: 'insecticide', category: 'protection', name: 'Insecticide', kannadaName: 'ಕೀಟನಾಶಕ', icon: '🐛' },
  { id: 'fungicide', category: 'protection', name: 'Fungicide', kannadaName: 'ಶಿಲೀಂಧ್ರನಾಶಕ', icon: '🐛' },
  { id: 'weedicide', category: 'protection', name: 'Weedicide', kannadaName: 'ಕಳೆನಾಶಕ', icon: '🐛' },
  { id: 'sprayer', category: 'tools', name: 'Sprayer', kannadaName: 'ಸ್ಪ್ರೇಯರ್', icon: '🔧' },
  { id: 'sickle', category: 'tools', name: 'Sickle', kannadaName: 'ಕುಡುಗೋಲು', icon: '🔧' },
  { id: 'tarpaulin', category: 'tools', name: 'Tarpaulin', kannadaName: 'ತಾಡಪಾಲು', icon: '🔧' },
];

export function getShopCatalogItem(itemId) {
  return shopProductCatalog.find((p) => p.id === itemId);
}

export function getShopCatalogByCategory(category) {
  return shopProductCatalog.filter((p) => p.category === category);
}
