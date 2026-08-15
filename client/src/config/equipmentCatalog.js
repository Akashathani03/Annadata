// Same shape as animalCatalog.js on purpose - Buy/Sell flows work
// identically for both, no component changes needed for the new
// category. Matches the backend's scripts/seed-equipment-catalog.js
// entries exactly (same ids, so itemId always resolves consistently
// between frontend display data and the backend catalog record).
export const equipmentCatalog = [
  { id: 'tractor', category: 'equipment', group: 'equipment', name: 'Tractor', kannadaName: 'ಟ್ರ್ಯಾಕ್ಟರ್', icon: '🚜', defaultUnit: 'Unit' },
  { id: 'power_tiller', category: 'equipment', group: 'equipment', name: 'Power Tiller', kannadaName: 'ಪವರ್ ಟಿಲ್ಲರ್', icon: '🚜', defaultUnit: 'Unit' },
  { id: 'sprayer', category: 'equipment', group: 'equipment', name: 'Sprayer', kannadaName: 'ಸ್ಪ್ರೇಯರ್', icon: '💦', defaultUnit: 'Unit' },
  { id: 'water_pump', category: 'equipment', group: 'equipment', name: 'Water Pump', kannadaName: 'ನೀರಿನ ಪಂಪ್', icon: '⚙️', defaultUnit: 'Unit' },
  { id: 'thresher', category: 'equipment', group: 'equipment', name: 'Thresher', kannadaName: 'ಥ್ರೆಷರ್', icon: '🌾', defaultUnit: 'Unit' },
  { id: 'cultivator', category: 'equipment', group: 'equipment', name: 'Cultivator', kannadaName: 'ಕಲ್ಟಿವೇಟರ್', icon: '🚜', defaultUnit: 'Unit' },
  { id: 'harvester', category: 'equipment', group: 'equipment', name: 'Harvester', kannadaName: 'ಹಾರ್ವೆಸ್ಟರ್', icon: '🌾', defaultUnit: 'Unit' },
  { id: 'other_equipment', category: 'equipment', group: 'equipment', name: 'Other Equipment', kannadaName: 'ಇತರೆ ಉಪಕರಣ', icon: '🔧', defaultUnit: 'Unit' },
];

export function getEquipmentById(equipmentId) {
  return equipmentCatalog.find((e) => e.id === equipmentId);
}
