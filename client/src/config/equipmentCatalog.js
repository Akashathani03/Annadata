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

  // Kept identical (same ids) to server/scripts/seed-equipment-catalog.js.
  { id: 'rotavator', category: 'equipment', group: 'equipment', name: 'Rotavator', kannadaName: 'ರೋಟವೇಟರ್', icon: '🚜', defaultUnit: 'Unit' },
  { id: 'plough', category: 'equipment', group: 'equipment', name: 'Plough', kannadaName: 'ನೇಗಿಲು', icon: '🚜', defaultUnit: 'Unit' },
  { id: 'seed_drill', category: 'equipment', group: 'equipment', name: 'Seed Drill', kannadaName: 'ಬಿತ್ತನೆ ಯಂತ್ರ', icon: '🌱', defaultUnit: 'Unit' },
  { id: 'chaff_cutter', category: 'equipment', group: 'equipment', name: 'Chaff Cutter', kannadaName: 'ಮೇವು ಕತ್ತರಿಸುವ ಯಂತ್ರ', icon: '✂️', defaultUnit: 'Unit' },
  { id: 'trolley', category: 'equipment', group: 'equipment', name: 'Tractor Trolley', kannadaName: 'ಟ್ರ್ಯಾಕ್ಟರ್ ಟ್ರಾಲಿ', icon: '🚛', defaultUnit: 'Unit' },
  { id: 'generator', category: 'equipment', group: 'equipment', name: 'Generator', kannadaName: 'ಜನರೇಟರ್', icon: '🔌', defaultUnit: 'Unit' },
  { id: 'solar_pump', category: 'equipment', group: 'equipment', name: 'Solar Water Pump', kannadaName: 'ಸೌರ ನೀರಿನ ಪಂಪ್', icon: '☀️', defaultUnit: 'Unit' },
  { id: 'weeder', category: 'equipment', group: 'equipment', name: 'Weeder', kannadaName: 'ಕಳೆ ತೆಗೆಯುವ ಯಂತ್ರ', icon: '🌿', defaultUnit: 'Unit' },
];

export function getEquipmentById(equipmentId) {
  return equipmentCatalog.find((e) => e.id === equipmentId);
}
