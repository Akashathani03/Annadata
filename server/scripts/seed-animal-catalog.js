// Extends the existing Crop collection (Step 7) with animal catalog
// entries - not a separate collection, per the approved Marketplace
// Backend Phase decision. Same shape (_id, category, group, name,
// kannadaName, icon, defaultUnit), ported from the frontend's
// config/animalCatalog.js exactly, just with category:'animal'
// distinguishing these from the existing category:'crop' entries.
//
// Usage: node scripts/seed-animal-catalog.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { Crop } from '../src/models/Crop.js';

dotenv.config();

const animals = [
  { _id: 'cow', category: 'animal', group: 'cattle', name: 'Cow', kannadaName: 'ಹಸು', icon: '🐄', defaultUnit: 'Head' },
  { _id: 'bull', category: 'animal', group: 'cattle', name: 'Bull', kannadaName: 'ಎತ್ತು', icon: '🐂', defaultUnit: 'Head' },
  { _id: 'calf', category: 'animal', group: 'cattle', name: 'Calf', kannadaName: 'ಕರು', icon: '🐮', defaultUnit: 'Head' },
  { _id: 'buffalo', category: 'animal', group: 'buffalo', name: 'Buffalo', kannadaName: 'ಎಮ್ಮೆ', icon: '🐃', defaultUnit: 'Head' },
  { _id: 'goat', category: 'animal', group: 'goat', name: 'Goat', kannadaName: 'ಮೇಕೆ', icon: '🐐', defaultUnit: 'Head' },
  { _id: 'sheep', category: 'animal', group: 'sheep', name: 'Sheep', kannadaName: 'ಕುರಿ', icon: '🐑', defaultUnit: 'Head' },
  { _id: 'hen', category: 'animal', group: 'poultry', name: 'Hen', kannadaName: 'ಕೋಳಿ', icon: '🐔', defaultUnit: 'Head' },
  { _id: 'duck', category: 'animal', group: 'poultry', name: 'Duck', kannadaName: 'ಬಾತುಕೋಳಿ', icon: '🦆', defaultUnit: 'Head' },

  // Added to round out each existing category (cattle/buffalo/goat/
  // sheep/poultry) with the young/distinct animal types farmers
  // actually list separately from the adult ones above - no new
  // groups introduced, so every entry stays reachable through the
  // filter chips animalCatalog.js already defines.
  { _id: 'heifer', category: 'animal', group: 'cattle', name: 'Heifer', kannadaName: 'ಕಿರಿ ಹಸು', icon: '🐄', defaultUnit: 'Head' },
  { _id: 'buffalo_calf', category: 'animal', group: 'buffalo', name: 'Buffalo Calf', kannadaName: 'ಎಮ್ಮೆ ಕರು', icon: '🐃', defaultUnit: 'Head' },
  { _id: 'goat_kid', category: 'animal', group: 'goat', name: 'Goat Kid', kannadaName: 'ಮೇಕೆ ಮರಿ', icon: '🐐', defaultUnit: 'Head' },
  { _id: 'lamb', category: 'animal', group: 'sheep', name: 'Lamb', kannadaName: 'ಕುರಿ ಮರಿ', icon: '🐑', defaultUnit: 'Head' },
  { _id: 'rooster', category: 'animal', group: 'poultry', name: 'Rooster', kannadaName: 'ಹುಂಜ', icon: '🐓', defaultUnit: 'Head' },
  { _id: 'turkey', category: 'animal', group: 'poultry', name: 'Turkey', kannadaName: 'ಟರ್ಕಿ ಕೋಳಿ', icon: '🦃', defaultUnit: 'Head' },
];

async function seed() {
  await connectDatabase();

  for (const animal of animals) {
    await Crop.findByIdAndUpdate(animal._id, animal, { upsert: true });
  }
  console.log(`Seeded ${animals.length} animal catalog entries into the existing Crop collection.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
