// Extends the existing Crop collection with equipment catalog entries -
// not a separate collection, same "extend, don't duplicate the
// catalog" decision already applied to animals. Same shape (_id,
// category, group, name, kannadaName, icon, defaultUnit) as the crop
// and animal entries. defaultUnit is 'Unit' for every entry - unlike
// crops/animals, equipment is never sold by weight or head count.
//
// Usage: node scripts/seed-equipment-catalog.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { Crop } from '../src/models/Crop.js';

dotenv.config();

const equipment = [
  { _id: 'tractor', category: 'equipment', group: 'equipment', name: 'Tractor', kannadaName: 'ಟ್ರ್ಯಾಕ್ಟರ್', icon: '🚜', defaultUnit: 'Unit' },
  { _id: 'power_tiller', category: 'equipment', group: 'equipment', name: 'Power Tiller', kannadaName: 'ಪವರ್ ಟಿಲ್ಲರ್', icon: '🚜', defaultUnit: 'Unit' },
  { _id: 'sprayer', category: 'equipment', group: 'equipment', name: 'Sprayer', kannadaName: 'ಸ್ಪ್ರೇಯರ್', icon: '💦', defaultUnit: 'Unit' },
  { _id: 'water_pump', category: 'equipment', group: 'equipment', name: 'Water Pump', kannadaName: 'ನೀರಿನ ಪಂಪ್', icon: '⚙️', defaultUnit: 'Unit' },
  { _id: 'thresher', category: 'equipment', group: 'equipment', name: 'Thresher', kannadaName: 'ಥ್ರೆಷರ್', icon: '🌾', defaultUnit: 'Unit' },
  { _id: 'cultivator', category: 'equipment', group: 'equipment', name: 'Cultivator', kannadaName: 'ಕಲ್ಟಿವೇಟರ್', icon: '🚜', defaultUnit: 'Unit' },
  { _id: 'harvester', category: 'equipment', group: 'equipment', name: 'Harvester', kannadaName: 'ಹಾರ್ವೆಸ್ಟರ್', icon: '🌾', defaultUnit: 'Unit' },
  { _id: 'other_equipment', category: 'equipment', group: 'equipment', name: 'Other Equipment', kannadaName: 'ಇತರೆ ಉಪಕರಣ', icon: '🔧', defaultUnit: 'Unit' },
];

async function seed() {
  await connectDatabase();

  for (const item of equipment) {
    await Crop.findByIdAndUpdate(item._id, item, { upsert: true });
  }
  console.log(`Seeded ${equipment.length} equipment catalog entries into the existing Crop collection.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
