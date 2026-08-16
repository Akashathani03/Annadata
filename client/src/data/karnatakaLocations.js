// Karnataka administrative divisions, used to offer district/taluk
// dropdown suggestions (via <datalist>, so typing a value not in the
// list still works - the app's user base spans every district, and
// no bundled list is guaranteed 100% current). Villages aren't
// included: Karnataka has ~29,000 of them, too many to bundle
// reliably, so the village field stays manual-entry only.
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
  Belagavi: ['Belagavi', 'Athani', 'Bailhongal', 'Chikkodi', 'Gokak', 'Khanapura', 'Mudalgi', 'Nippani', 'Rayabaga', 'Savadatti', 'Ramadurga', 'Kagawada', 'Hukkeri', 'Kitturu', 'Yargatti'],
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
