// One-off offline processing script (not part of the running app).
// Reads the raw Census-2011-derived Karnataka village boundary geojson
// from datameet/indian_village_boundaries (86.5MB, downloaded
// separately to /tmp/ka.geojson) and produces a lean village-by-taluk
// lookup, grouped under this app's own canonical district/taluk
// spellings (client/src/data/karnatakaLocations.js) so the picker's
// existing taluk selection actually finds a matching group.
//
// Usage: node scripts/process-ka-villages.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import {
  KARNATAKA_DISTRICTS,
  KARNATAKA_TALUKS_BY_DISTRICT,
} from '../../client/src/data/karnatakaLocations.js';

const RAW_PATH = '/tmp/ka.geojson';
const OUT_DATA_PATH = '../../client/src/data/karnatakaVillages.js';
const OUT_REPORT_PATH = '/tmp/ka-village-match-report.json';

function normalize(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // drop parenthetical qualifiers like "(Rural)", "(K.S.)"
    .replace(/\btaluk[a]?\b/g, '')
    .replace(/\btehsil\b/g, '')
    .replace(/\bdistrict\b/g, '')
    .replace(/[^a-z]/g, ''); // strip spaces/punctuation entirely for a loose match
}

// Census 2011 uses Karnataka's pre-2014 district-name spellings
// (Tumkur, Bangalore, Mysore, Gulbarga, ...); the app already uses the
// post-2014 official renamed spellings. Keys are normalize()d.
const DISTRICT_ALIASES = {
  [normalize('Tumkur')]: 'Tumakuru',
  [normalize('Bangalore Rural')]: 'Bengaluru Rural',
  [normalize('Bangalore')]: 'Bengaluru Urban',
  [normalize('Shimoga')]: 'Shivamogga',
  [normalize('Gulbarga')]: 'Kalaburagi',
  [normalize('Mysore')]: 'Mysuru',
  [normalize('Uttar Kannad')]: 'Uttara Kannada',
  [normalize('Belgaum')]: 'Belagavi',
  [normalize('Chikmagalur')]: 'Chikkamagaluru',
  [normalize('Davangere')]: 'Davanagere',
  [normalize('Raichur')]: 'Raichuru',
  [normalize('Bijapur')]: 'Vijayapura',
  [normalize('Koppal')]: 'Koppala',
  [normalize('Bagalkot')]: 'Bagalkote',
  [normalize('Bellary')]: 'Ballari',
  [normalize('Chamarajnagar')]: 'Chamarajanagara',
};

// Chikkaballapura (2007) and Vijayanagara (2021) are newer districts
// carved out of Kolar and Bellary respectively, after Census 2011 was
// compiled - so their taluks appear under the old parent district in
// this data. Keyed by [censusResolvedDistrict, normalizedCensusTaluk]
// -> the district those taluks actually belong to today.
const TALUK_DISTRICT_OVERRIDES = {
  [`Kolar|${normalize('Chintamani')}`]: 'Chikkaballapura',
  [`Kolar|${normalize('Sidlaghatta')}`]: 'Chikkaballapura',
  [`Kolar|${normalize('Chikballapur')}`]: 'Chikkaballapura',
  [`Kolar|${normalize('Gauribidanur')}`]: 'Chikkaballapura',
  [`Kolar|${normalize('Bagepalli')}`]: 'Chikkaballapura',
  [`Kolar|${normalize('Gudibanda')}`]: 'Chikkaballapura',
  // Ramanagara (created 2007) - villages still filed under old undivided
  // "Bangalore Rural" in this Census-derived data.
  [`Bengaluru Rural|${normalize('Magadi')}`]: 'Ramanagara',
  [`Bengaluru Rural|${normalize('Kankapura')}`]: 'Ramanagara',
  [`Bengaluru Rural|${normalize('Channapatna')}`]: 'Ramanagara',
  [`Bengaluru Rural|${normalize('Ramanagaram')}`]: 'Ramanagara',
  // Vijayanagara (created 2021) - villages still filed under old
  // undivided Bellary or, for Harapanahalli, old Davanagere.
  [`Ballari|${normalize('Kudligi')}`]: 'Vijayanagara',
  [`Ballari|${normalize('Hospet')}`]: 'Vijayanagara',
  [`Ballari|${normalize('Hagaribommanahalli')}`]: 'Vijayanagara',
  [`Ballari|${normalize('Hadagalli')}`]: 'Vijayanagara',
  [`Davanagere|${normalize('Harpanahalli')}`]: 'Vijayanagara',
  // Yadagiri (created 2010) - villages still filed under old undivided
  // Gulbarga/Kalaburagi.
  [`Kalaburagi|${normalize('Shorapur')}`]: 'Yadagiri',
  [`Kalaburagi|${normalize('Shahpur')}`]: 'Yadagiri',
  [`Kalaburagi|${normalize('Yadgir')}`]: 'Yadagiri',
};

// Same pre-2014 vs current spelling gap, at the taluk level. Keyed by
// [ourResolvedDistrict, normalizedCensusTaluk] -> our canonical taluk
// name (from karnatakaLocations.js).
const TALUK_ALIASES = {
  [`Kolar|${normalize('Bangarpet')}`]: 'Bangarapete',
  [`Kolar|${normalize('Malur')}`]: 'Maluru',
  [`Kolar|${normalize('Srinivaspur')}`]: 'Srinivasapura',
  [`Kolar|${normalize('Mulbagal')}`]: 'Mulabagilu',
  [`Chikkaballapura|${normalize('Chikballapur')}`]: 'Chikkaballapura',
  [`Chikkaballapura|${normalize('Gauribidanur')}`]: 'Gauribidanuru',
  [`Hassan|${normalize('Channarayapatna')}`]: 'Channarayapattana',
  [`Hassan|${normalize('Belur')}`]: 'Beluru',
  [`Hassan|${normalize('Arsikere')}`]: 'Arasikere',
  [`Hassan|${normalize('Arkalgud')}`]: 'Arakalagudu',
  [`Hassan|${normalize('Alur')}`]: 'Aluru',
  [`Hassan|${normalize('Hole Narsipur')}`]: 'Holenarsipura',
  [`Hassan|${normalize('Sakleshpur')}`]: 'Sakleshpura',
  [`Mandya|${normalize('Krishnarajpet')}`]: 'Krishnarajapete',
  [`Mandya|${normalize('Malvalli')}`]: 'Malavalli',
  [`Mandya|${normalize('Maddur')}`]: 'Madduru',
  [`Mandya|${normalize('Shrirangapattana')}`]: 'Srirangapattana',
  [`Chitradurga|${normalize('Hosdurga')}`]: 'Hosadurga',
  [`Haveri|${normalize('Hangal')}`]: 'Hangala',
  [`Haveri|${normalize('Hirekerur')}`]: 'Hirekeruru',
  [`Haveri|${normalize('Ranibenur')}`]: 'Ranibennur',
  [`Haveri|${normalize('Shiggaon')}`]: 'Shiggavi',
  [`Haveri|${normalize('Bydagi')}`]: 'Byadgi',
  [`Haveri|${normalize('Savanur')}`]: 'Savanuru',
  [`Kodagu|${normalize('Somvarpet')}`]: 'Somawarapete',
  [`Kodagu|${normalize('Virajpet')}`]: 'Virajapete',
  [`Bidar|${normalize('Basavakalyan')}`]: 'Basavakalyana',
  [`Bidar|${normalize('Homnabad')}`]: 'Humnabad',
  [`Udupi|${normalize('Coondapur')}`]: 'Kundapura',
  [`Udupi|${normalize('Karkal')}`]: 'Karkala',
  [`Dakshina Kannada|${normalize('Mangalore')}`]: 'Mangaluru',
  [`Dakshina Kannada|${normalize('Bantval')}`]: 'Bantwala',
  [`Dakshina Kannada|${normalize('Beltangadi')}`]: 'Belathangadi',
  [`Dakshina Kannada|${normalize('Puttur')}`]: 'Putturu',
  [`Gadag|${normalize('Ron')}`]: 'Rona',
  [`Gadag|${normalize('Shirhatti')}`]: 'Shirahatti',
  [`Gadag|${normalize('Mundargi')}`]: 'Mundaragi',
  [`Gadag|${normalize('Nargund')}`]: 'Naragunda',
  [`Dharwad|${normalize('Navalgund')}`]: 'Navalgunda',
  [`Dharwad|${normalize('Kundgol')}`]: 'Kundagolu',

  [`Tumakuru|${normalize('Tumkur')}`]: 'Tumakuru',
  [`Tumakuru|${normalize('Korategere')}`]: 'Koratagere',
  [`Tumakuru|${normalize('Chiknayakanhalli')}`]: 'Chikkanayakanahalli',
  [`Tumakuru|${normalize('Tiptur')}`]: 'Tipturu',
  [`Chikkamagaluru|${normalize('Kadur')}`]: 'Kaduru',
  [`Chikkamagaluru|${normalize('Chikmagalur')}`]: 'Chikkamagaluru',
  [`Shivamogga|${normalize('Sorab')}`]: 'Soraba',
  [`Shivamogga|${normalize('Sagar')}`]: 'Sagara',
  [`Shivamogga|${normalize('Shimoga')}`]: 'Shivamogga',
  [`Shivamogga|${normalize('Shikarpur')}`]: 'Shikaripura',
  [`Bengaluru Rural|${normalize('Hoskote')}`]: 'Hosakote',
  [`Bengaluru Rural|${normalize('Dod Ballapur')}`]: 'Doddaballapura',
  [`Bengaluru Rural|${normalize('Nelamagala')}`]: 'Nelamangala',
  [`Bengaluru Rural|${normalize('Devanhalli')}`]: 'Devanahalli',
  [`Ramanagara|${normalize('Kankapura')}`]: 'Kanakapura',
  [`Ramanagara|${normalize('Channapatna')}`]: 'Channapattana',
  [`Ramanagara|${normalize('Ramanagaram')}`]: 'Ramanagara',
  [`Mysuru|${normalize('Heggadadevankote')}`]: 'Heggadadevanakote',
  [`Mysuru|${normalize('Hunsur')}`]: 'Hunasuru',
  [`Mysuru|${normalize('Piriyapatana')}`]: 'Piriyapattana',
  [`Mysuru|${normalize('Nanjangud')}`]: 'Nanjanagodu',
  [`Mysuru|${normalize('Mysore')}`]: 'Mysuru',
  [`Mysuru|${normalize('Tirumakudal Narsipur')}`]: 'Tirumakudalu Narasipura',
  [`Belagavi|${normalize('Khanapur')}`]: 'Khanapura',
  [`Belagavi|${normalize('Belgaum')}`]: 'Belagavi',
  [`Belagavi|${normalize('Hukeri')}`]: 'Hukkeri',
  [`Belagavi|${normalize('Saundatti')}`]: 'Savadatti',
  [`Belagavi|${normalize('Chikodi')}`]: 'Chikkodi',
  [`Belagavi|${normalize('Ramdurg')}`]: 'Ramadurga',
  [`Belagavi|${normalize('Athni')}`]: 'Athani',
  [`Uttara Kannada|${normalize('Siddapur')}`]: 'Siddapura',
  [`Uttara Kannada|${normalize('Yellapur')}`]: 'Yellapura',
  [`Uttara Kannada|${normalize('Supa')}`]: 'Joida',
  [`Uttara Kannada|${normalize('Honavar')}`]: 'Honnavara',
  [`Uttara Kannada|${normalize('Mundgod')}`]: 'Mundagodu',
  [`Uttara Kannada|${normalize('Karwar')}`]: 'Karwara',
  [`Raichuru|${normalize('Lingsugur')}`]: 'Lingasaguru',
  [`Raichuru|${normalize('Sindhnur')}`]: 'Sindhanuru',
  [`Raichuru|${normalize('Raichur')}`]: 'Raichuru',
  [`Chamarajanagara|${normalize('Chamarajnagar')}`]: 'Chamarajanagara',
  [`Chamarajanagara|${normalize('Gundlupet')}`]: 'Gundlupete',
  [`Chamarajanagara|${normalize('Kollegal')}`]: 'Kollegala',
  [`Chamarajanagara|${normalize('Yelandur')}`]: 'Yelanduru',
  [`Davanagere|${normalize('Davangere')}`]: 'Davanagere',
  [`Davanagere|${normalize('Jagalur')}`]: 'Jagaluru',
  [`Davanagere|${normalize('Harihar')}`]: 'Harihara',
  [`Bagalkote|${normalize('Hungund')}`]: 'Hunagunda',
  [`Bagalkote|${normalize('Bagalkot')}`]: 'Bagalkote',
  [`Bagalkote|${normalize('Mudhol')}`]: 'Mudhola',
  [`Bagalkote|${normalize('Bilgi')}`]: 'Bilagi',
  [`Koppala|${normalize('Gangawati')}`]: 'Gangavathi',
  [`Koppala|${normalize('Koppal')}`]: 'Koppala',
  [`Koppala|${normalize('Yelbarga')}`]: 'Yelaburga',
  [`Vijayapura|${normalize('Muddebihal')}`]: 'Muddebihala',
  [`Vijayapura|${normalize('Basavana Bagevadi')}`]: 'Basavana Bagewadi',
  [`Vijayapura|${normalize('Bijapur')}`]: 'Vijayapura',
  [`Kalaburagi|${normalize('Gulbarga')}`]: 'Kalaburagi',
  [`Kalaburagi|${normalize('Aland')}`]: 'Alanda',
  [`Kalaburagi|${normalize('Chitapur')}`]: 'Chitapura',
  [`Kalaburagi|${normalize('Afsalpur')}`]: 'Afzalpura',
  [`Ballari|${normalize('Bellary')}`]: 'Ballari',
  [`Ballari|${normalize('Sandur')}`]: 'Sanduru',
  [`Ballari|${normalize('Siruguppa')}`]: 'Siraguppa',
  [`Yadagiri|${normalize('Shorapur')}`]: 'Surapura',
  [`Yadagiri|${normalize('Shahpur')}`]: 'Shahapura',
  [`Yadagiri|${normalize('Yadgir')}`]: 'Yadagiri',
  [`Vijayanagara|${normalize('Hospet')}`]: 'Hosapete',
  [`Vijayanagara|${normalize('Hadagalli')}`]: 'Hoovina Hadagali',
  [`Vijayanagara|${normalize('Harpanahalli')}`]: 'Harapanahalli',
};

// Area-weighted centroid of a single polygon ring (shoelace-based),
// which is what a village's boundary is actually made of - a plain
// average of the vertices would skew toward whichever edge happens to
// have more points sampled along it, rather than the shape's true
// "center of mass". Falls back to a simple vertex average for a
// degenerate (near-zero-area) ring, e.g. a self-intersecting or
// collinear boundary - rare, but real-world OSM/Census polygon data
// occasionally has them.
function ringCentroid(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) {
    const n = ring.length;
    const avg = ring.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y], [0, 0]);
    return { lng: avg[0] / n, lat: avg[1] / n, area: 0 };
  }
  return { lng: cx / (6 * area), lat: cy / (6 * area), area: Math.abs(area) };
}

// A village's geometry is a Polygon (one outer ring - holes ignored,
// essentially nonexistent for revenue village boundaries) or a
// MultiPolygon (disjoint parts, e.g. a village with an exclave) -
// weight each part's centroid by its own area so a village's true
// center of mass wins over a stray sliver part.
function featureCentroid(geometry) {
  if (!geometry) return null;
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];

  let totalArea = 0;
  let cx = 0;
  let cy = 0;
  for (const rings of polygons) {
    const outerRing = rings[0]; // ignore inner (hole) rings
    if (!outerRing || outerRing.length < 4) continue;
    const c = ringCentroid(outerRing);
    const weight = c.area || 1; // degenerate rings still contribute, just unweighted
    totalArea += weight;
    cx += c.lng * weight;
    cy += c.lat * weight;
  }
  if (totalArea === 0) return null;
  return { lat: cy / totalArea, lng: cx / totalArea };
}

console.log('Reading', RAW_PATH);
const raw = JSON.parse(readFileSync(RAW_PATH, 'utf-8'));
console.log('Features:', raw.features.length);

// Build normalized lookup: normalizedDistrict -> normalizedTaluk -> our canonical [district, taluk]
const canonicalIndex = new Map();
for (const district of KARNATAKA_DISTRICTS) {
  const nd = normalize(district);
  if (!canonicalIndex.has(nd)) canonicalIndex.set(nd, { district, taluks: new Map() });
  const taluks = KARNATAKA_TALUKS_BY_DISTRICT[district] || [];
  for (const taluk of taluks) {
    canonicalIndex.get(nd).taluks.set(normalize(taluk), taluk);
  }
}

// grouped[canonicalDistrict][canonicalTaluk] = Set(villageName)
const grouped = {};
let matched = 0;
let unmatchedDistrict = 0;
let unmatchedTaluk = 0;
const unmatchedDistrictSamples = new Map();
const unmatchedTalukSamples = new Map();

for (const feature of raw.features) {
  const p = feature.properties || {};
  const villageName = (p.NAME || p.VILL_NAME || '').toString().trim();
  const censusDistrict = (p.DISTRICT || p.DIST_NAME || '').toString().trim();
  const censusTaluk = (p.TALUK || p.TALUKA_NAM || '').toString().trim();
  if (!villageName || !censusDistrict || !censusTaluk) continue;

  const nd = normalize(censusDistrict);
  let districtEntry = canonicalIndex.get(nd);
  if (!districtEntry && DISTRICT_ALIASES[nd]) {
    districtEntry = canonicalIndex.get(normalize(DISTRICT_ALIASES[nd]));
  }
  if (!districtEntry) {
    unmatchedDistrict++;
    unmatchedDistrictSamples.set(censusDistrict, (unmatchedDistrictSamples.get(censusDistrict) || 0) + 1);
    continue;
  }

  const nt = normalize(censusTaluk);

  // A taluk whose district was split out (Chikkaballapura from Kolar,
  // Vijayanagara from Bellary) after Census 2011 resolves to a
  // different district than the one just matched above.
  const overrideDistrictName = TALUK_DISTRICT_OVERRIDES[`${districtEntry.district}|${nt}`];
  if (overrideDistrictName) {
    districtEntry = canonicalIndex.get(normalize(overrideDistrictName));
  }

  let canonicalTaluk = districtEntry.taluks.get(nt);
  if (!canonicalTaluk) {
    const aliasedTaluk = TALUK_ALIASES[`${districtEntry.district}|${nt}`];
    if (aliasedTaluk) canonicalTaluk = districtEntry.taluks.get(normalize(aliasedTaluk));
  }
  if (!canonicalTaluk) {
    unmatchedTaluk++;
    const key = `${districtEntry.district} / ${censusTaluk}`;
    unmatchedTalukSamples.set(key, (unmatchedTalukSamples.get(key) || 0) + 1);
    continue;
  }

  const centroid = featureCentroid(feature.geometry);

  matched++;
  grouped[districtEntry.district] ??= {};
  grouped[districtEntry.district][canonicalTaluk] ??= new Map();
  // First occurrence wins on a duplicate name within the same taluk
  // (rare, but two real neighboring hamlets can share a name) - kept
  // simple rather than averaging two genuinely different locations
  // together, which would place the point between them, in neither.
  if (!grouped[districtEntry.district][canonicalTaluk].has(villageName)) {
    grouped[districtEntry.district][canonicalTaluk].set(villageName, centroid);
  }
}

// Sort into the final bundle - {name, lat, lng} per village, or just
// the name (no lat/lng keys) when centroid computation failed for
// that one feature, so a farmer can still pick it even without a
// distance-capable coordinate.
const output = {};
let totalVillages = 0;
let villagesWithCoords = 0;
let coveredTaluks = 0;
for (const district of Object.keys(grouped).sort()) {
  output[district] = {};
  for (const taluk of Object.keys(grouped[district]).sort()) {
    const entries = [...grouped[district][taluk].entries()].sort((a, b) => a[0].localeCompare(b[0]));
    output[district][taluk] = entries.map(([name, centroid]) => {
      totalVillages++;
      if (centroid) {
        villagesWithCoords++;
        return { name, lat: Number(centroid.lat.toFixed(5)), lng: Number(centroid.lng.toFixed(5)) };
      }
      return { name };
    });
    coveredTaluks++;
  }
}

const totalOurTaluks = Object.values(KARNATAKA_TALUKS_BY_DISTRICT).reduce((n, arr) => n + arr.length, 0);

const report = {
  totalFeatures: raw.features.length,
  matchedFeatures: matched,
  unmatchedDistrictFeatures: unmatchedDistrict,
  unmatchedTalukFeatures: unmatchedTaluk,
  totalVillagesInOutput: totalVillages,
  villagesWithCoords,
  villagesMissingCoords: totalVillages - villagesWithCoords,
  ourTotalTaluks: totalOurTaluks,
  coveredTaluks,
  coveragePct: ((coveredTaluks / totalOurTaluks) * 100).toFixed(1),
  unmatchedDistrictSamples: Object.fromEntries(
    [...unmatchedDistrictSamples.entries()].sort((a, b) => b[1] - a[1])
  ),
  unmatchedTalukSamples: Object.fromEntries(
    [...unmatchedTalukSamples.entries()].sort((a, b) => b[1] - a[1])
  ),
};

writeFileSync(OUT_REPORT_PATH, JSON.stringify(report, null, 2));
console.log('Report written to', OUT_REPORT_PATH);
console.log(JSON.stringify({ ...report, unmatchedDistrictSamples: undefined, unmatchedTalukSamples: undefined }, null, 2));

const fileContents = `// Villages per Karnataka district/taluk, each with an approximate
// lat/lng (the village boundary polygon's area-weighted centroid),
// sourced from Census 2011 village boundaries
// (datameet/indian_village_boundaries, ODbL-1.0 licensed -
// https://github.com/datameet/indian_village_boundaries). Generated
// once by server/scripts/process-ka-villages.mjs from the raw
// ka.geojson (not checked in - 86.5MB), grouped under this file's own
// canonical district/taluk spellings from karnatakaLocations.js so a
// lookup by the taluk the farmer already selected always matches a key
// here. Not every taluk has a matched group, and a handful of
// villages have no lat/lng (centroid computation failed on a
// degenerate polygon) - see the generation script's report. Callers
// must always let the farmer type their own village when a taluk has
// no entry or the right one is missing, and must treat a missing
// lat/lng on a matched village as "no coordinate available", never as
// (0, 0) or some other guessed default.
export const KARNATAKA_VILLAGES_BY_TALUK = ${JSON.stringify(output)};
`;

writeFileSync(new URL(OUT_DATA_PATH, import.meta.url), fileContents);
console.log('Data file written to', OUT_DATA_PATH);
