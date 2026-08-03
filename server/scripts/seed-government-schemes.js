// Seeds GovernmentScheme with the exact same 5 schemes that currently
// live in the frontend's data/governmentSchemes.js.
// Usage: node scripts/seed-government-schemes.js

import dotenv from 'dotenv';
import { connectDatabase } from '../src/config/database.js';
import { GovernmentScheme } from '../src/models/GovernmentScheme.js';

dotenv.config();

const schemes = [
  {
    _id: 'pm-kisan',
    title: 'PM-KISAN Samman Nidhi',
    dept: 'Central · Ministry of Agriculture & Farmers Welfare',
    scope: 'central',
    iconBg: '#e8f5ec',
    icon: '💰',
    status: 'open',
    description: 'Income support of ₹6,000 per year, paid in three instalments, to all landholding farmer families.',
    detailDescription: 'Income support of ₹6,000/year, paid in three instalments, to all landholding farmer families.',
    amount: '₹6,000/year',
    deadline: '31 Aug 2026',
    appliedCount: '10K+',
    officialUrl: 'https://pmkisan.gov.in',
    eligibility: [
      'Own cultivable land in your name',
      'Valid Aadhaar linked to bank account',
      'Registered as a farmer on Annadata',
    ],
  },
  {
    _id: 'pmfby',
    title: 'Pradhan Mantri Fasal Bima Yojana',
    dept: 'Central · Crop Insurance Scheme',
    scope: 'central',
    iconBg: '#e6f0fb',
    icon: '🛡️',
    status: 'closing',
    description: 'Affordable crop insurance covering losses from natural calamities, pests and diseases.',
    detailDescription: 'Affordable crop insurance covering losses from natural calamities, pests and diseases.',
    amount: 'Low premium',
    detailAmount: 'Low premium (1.5–5% of sum insured)',
    deadline: '5 Aug 2026',
    appliedCount: '6K+',
    officialUrl: 'https://pmfby.gov.in',
    eligibility: [
      'Farmer growing a notified crop in a notified area',
      'Loanee or non-loanee farmer, both eligible',
      'Enrol before the cut-off date for the season',
    ],
  },
  {
    _id: 'pmksy',
    title: 'PM Krishi Sinchayee Yojana',
    dept: 'Central · Irrigation & Water Efficiency',
    scope: 'central',
    iconBg: '#fdeee0',
    icon: '💧',
    status: 'open',
    description: 'Subsidy support for drip and sprinkler irrigation systems to improve water-use efficiency.',
    detailDescription: 'Subsidy support for drip and sprinkler irrigation systems to improve water-use efficiency.',
    amount: 'Up to 55% subsidy',
    detailAmount: 'Up to 55% subsidy on equipment cost',
    deadline: '20 Sep 2026',
    appliedCount: '3K+',
    officialUrl: 'https://pmksy.gov.in',
    eligibility: [
      'Own or lease agricultural land',
      'Willing to install micro-irrigation (drip/sprinkler)',
      'Apply through state horticulture/agriculture dept',
    ],
  },
  {
    _id: 'kcc',
    title: 'Kisan Credit Card',
    dept: 'Central · Farm Credit & Loans',
    scope: 'central',
    iconBg: '#ede8fb',
    icon: '🏦',
    status: 'open',
    description: 'Easy access to short-term credit for crop and post-harvest expenses at low interest rates.',
    detailDescription: 'Easy access to short-term credit for crop and post-harvest expenses at low interest rates.',
    amount: 'Up to ₹3 lakh',
    detailAmount: 'Up to ₹3 lakh at subsidised interest',
    deadline: 'Ongoing',
    detailDeadline: 'Ongoing — no fixed deadline',
    appliedCount: '8K+',
    officialUrl: 'https://www.myscheme.gov.in/schemes/kcc',
    eligibility: [
      'Farmer, tenant farmer, or sharecropper',
      'Valid land records or lease agreement',
      'Apply via any nationalised bank or the portal',
    ],
  },
  {
    _id: 'krishi-bhagya',
    title: 'Krishi Bhagya Yojane',
    dept: 'Karnataka State · Dept. of Agriculture',
    scope: 'state',
    iconBg: '#fff3d6',
    icon: '🌾',
    status: 'open',
    description: 'Karnataka-specific support for farm ponds, micro-irrigation and rainwater harvesting for dryland farmers.',
    detailDescription: 'Support for farm ponds, micro-irrigation and rainwater harvesting for dryland farmers in Karnataka.',
    amount: 'Up to 90% subsidy',
    detailAmount: 'Up to 90% subsidy for SC/ST, 80% for others',
    deadline: '15 Sep 2026',
    appliedCount: '2K+',
    officialUrl: 'https://raitamitra.karnataka.gov.in',
    eligibility: [
      'Farmer in a Karnataka dryland taluk',
      'Land suitable for a farm pond',
      'Apply through Raitha Samparka Kendra',
    ],
  },
];

async function seed() {
  await connectDatabase();

  for (const scheme of schemes) {
    await GovernmentScheme.findByIdAndUpdate(scheme._id, scheme, { upsert: true });
  }
  console.log(`Seeded ${schemes.length} government schemes.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
