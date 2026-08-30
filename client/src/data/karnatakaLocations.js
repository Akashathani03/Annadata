// Karnataka administrative divisions, used to offer district/taluk
// dropdown suggestions (via <datalist>, so typing a value not in the
// list still works - the app's user base spans every district, and
// no bundled list is guaranteed 100% current).
import { KARNATAKA_VILLAGES_BY_TALUK } from './karnatakaVillages.js';

export const KARNATAKA = 'Karnataka';

export const KARNATAKA_DISTRICTS = [
  'Bagalkote',
  'Ballari',
  'Belagavi',
  'Bengaluru Urban',
  'Bengaluru Rural',
  'Bidar',
  'Chamarajanagara',
  'Chikkaballapura',
  'Chikkamagaluru',
  'Chitradurga',
  'Dakshina Kannada',
  'Davanagere',
  'Dharwad',
  'Gadag',
  'Hassan',
  'Haveri',
  'Kalaburagi',
  'Kodagu',
  'Kolar',
  'Koppala',
  'Mandya',
  'Mysuru',
  'Raichuru',
  'Ramanagara',
  'Shivamogga',
  'Tumakuru',
  'Udupi',
  'Uttara Kannada',
  'Vijayapura',
  'Yadagiri',
  'Vijayanagara',
];

export const KARNATAKA_TALUKS_BY_DISTRICT = {
  Bagalkote: ['Bagalkote', 'Jamkhandi', 'Mudhola', 'Badami', 'Bilagi', 'Hunagunda', 'Ilkal', 'Rabkavi Banhatti', 'Guledgudda'],
  Ballari: ['Ballari', 'Kurugodu', 'Kampli', 'Sanduru', 'Siraguppa'],
  Belagavi: ['Belagavi', 'Athani', 'Bailhongal', 'Chikkodi', 'Gokak', 'Khanapura', 'Mudalgi', 'Nippani', 'Raybag', 'Savadatti', 'Ramadurga', 'Kagawada', 'Hukkeri', 'Kitturu', 'Yargatti'],
  'Bengaluru Urban': ['Bengaluru', 'Kengeri', 'Krishnarajapura', 'Anekal', 'Yelahanka'],
  'Bengaluru Rural': ['Nelamangala', 'Doddaballapura', 'Devanahalli', 'Hosakote'],
  Bidar: ['Aurad', 'Basavakalyana', 'Bhalki', 'Bidar', 'Chitgoppa', 'Hulsuru', 'Humnabad', 'Kamalanagara'],
  Chamarajanagara: ['Chamarajanagara', 'Gundlupete', 'Kollegala', 'Yelanduru', 'Hanuru'],
  Chikkaballapura: ['Chikkaballapura', 'Bagepalli', 'Chintamani', 'Gauribidanuru', 'Gudibanda', 'Sidlaghatta', 'Cheluru', 'Manchenahalli'],
  Chikkamagaluru: ['Chikkamagaluru', 'Kaduru', 'Koppa', 'Mudigere', 'Narasimharajapura', 'Sringeri', 'Tarikere', 'Ajjampura', 'Kalasa'],
  Chitradurga: ['Chitradurga', 'Challakere', 'Hiriyur', 'Holalkere', 'Hosadurga', 'Molakalmuru'],
  'Dakshina Kannada': ['Mangaluru', 'Ullal', 'Mulki', 'Moodbidri', 'Bantwala', 'Belathangadi', 'Putturu', 'Sulya', 'Kadaba'],
  Davanagere: ['Davanagere', 'Harihara', 'Channagiri', 'Honnali', 'Nyamathi', 'Jagaluru'],
  Dharwad: ['Kalghatgi', 'Dharwad', 'Hubballi (Rural)', 'Hubballi (Urban)', 'Kundagolu', 'Navalgunda', 'Alnavara', 'Annigeri'],
  Gadag: ['Gadag', 'Naragunda', 'Mundaragi', 'Rona', 'Gajendragada', 'Lakshmeshwara', 'Shirahatti'],
  Hassan: ['Hassan', 'Arasikere', 'Channarayapattana', 'Holenarsipura', 'Sakleshpura', 'Aluru', 'Arakalagudu', 'Beluru'],
  Haveri: ['Ranibennur', 'Byadgi', 'Hangala', 'Haveri', 'Savanuru', 'Hirekeruru', 'Shiggavi', 'Rattihalli'],
  Kalaburagi: ['Kalaburagi', 'Afzalpura', 'Alanda', 'Chincholi', 'Chitapura', 'Jevargi', 'Sedam', 'Kamalapura', 'Shahabad', 'Kalgi', 'Yedrami'],
  Kodagu: ['Madikeri', 'Somawarapete', 'Virajapete', 'Ponnammapete', 'Kushalnagara'],
  Kolar: ['Kolar', 'Bangarapete', 'Maluru', 'Mulabagilu', 'Srinivasapura', 'Kolar Gold Fields'],
  Koppala: ['Koppala', 'Gangavathi', 'Kushtagi', 'Yelaburga', 'Kanakagiri', 'Karatagi', 'Kukanuru'],
  Mandya: ['Mandya', 'Madduru', 'Malavalli', 'Srirangapattana', 'Krishnarajapete', 'Nagamangala', 'Pandavapura'],
  Mysuru: ['Mysuru', 'Hunasuru', 'Krishnarajanagara', 'Nanjanagodu', 'Heggadadevanakote', 'Piriyapattana', 'Tirumakudalu Narasipura', 'Saraguru', 'Saligrama'],
  Raichuru: ['Raichuru', 'Sindhanuru', 'Manvi', 'Devadurga', 'Lingasaguru', 'Mudgal', 'Maski', 'Sirawara'],
  Ramanagara: ['Ramanagara', 'Magadi', 'Kanakapura', 'Channapattana', 'Harohalli'],
  Shivamogga: ['Shivamogga', 'Sagara', 'Bhadravathi', 'Hosanagara', 'Shikaripura', 'Soraba', 'Tirthahalli'],
  Tumakuru: ['Tumakuru', 'Chikkanayakanahalli', 'Kunigal', 'Madhugiri', 'Sira', 'Tipturu', 'Gubbi', 'Koratagere', 'Pavagada', 'Turuvekere'],
  Udupi: ['Udupi', 'Kapu', 'Bynduru', 'Karkala', 'Kundapura', 'Hebri', 'Brahmavara'],
  'Uttara Kannada': ['Karwara', 'Sirsi', 'Joida', 'Dandeli', 'Bhatkal', 'Kumta', 'Ankola', 'Haliyal', 'Honnavara', 'Mundagodu', 'Siddapura', 'Yellapura'],
  Vijayapura: ['Vijayapura', 'Indi', 'Basavana Bagewadi', 'Sindgi', 'Muddebihala', 'Talikote', 'Devara Hipparagi', 'Chadchana', 'Tikote', 'Babaleshwara', 'Kolhara', 'Nidagundi', 'Alamela'],
  Yadagiri: ['Yadagiri', 'Shahapura', 'Surapura', 'Gurmitkala', 'Vadagera', 'Hunsagi'],
  Vijayanagara: ['Hosapete', 'Hagaribommanahalli', 'Harapanahalli', 'Hoovina Hadagali', 'Kudligi', 'Kotturu'],
};

// Taluk suggestions for a given district; empty (not all-taluks) when
// the district is blank/unrecognized, so the dropdown doesn't dump
// every taluk in the state before a district's been picked.
export function getTaluksForDistrict(district) {
  return KARNATAKA_TALUKS_BY_DISTRICT[district?.trim()] || [];
}

function villagesForTaluk(district, taluk) {
  return KARNATAKA_VILLAGES_BY_TALUK[district?.trim()]?.[taluk?.trim()] || [];
}

// Village name suggestions for a given district+taluk, from the
// bundled Census 2011 dataset (see karnatakaVillages.js) - a
// synchronous local lookup, not a network call. Empty when the
// district/taluk is blank, unrecognized, or genuinely has no bundled
// data (mainly taluks created after the 2011 census - see the
// generation script's match report) - callers must always still let
// the farmer type their own village in that case, same as before this
// dataset existed. Plain name strings, matching every other picker
// here (getTaluksForDistrict, KARNATAKA_DISTRICTS) - use
// getVillageLocation for a specific village's coordinates.
export function getVillagesForTaluk(district, taluk) {
  return villagesForTaluk(district, taluk).map((v) => v.name);
}

// A specific village's approximate coordinates (its Census boundary
// polygon's centroid), for distance-to-shop/market/listing
// calculations - null when the village/taluk/district combination
// isn't in the bundled dataset, or centroid computation failed for
// that one village. Never returns a guessed/default coordinate -
// callers must fall back to another location source (live GPS, saved
// profile lat/lng, or the anonymous default) rather than treat a null
// here as (0, 0) or the district/taluk's own location.
export function getVillageLocation(district, taluk, village) {
  const match = villagesForTaluk(district, taluk).find((v) => v.name === village?.trim());
  return match?.lat != null && match?.lng != null ? { lat: match.lat, lng: match.lng } : null;
}
