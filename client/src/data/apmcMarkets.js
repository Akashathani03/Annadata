// distanceKm is a static fallback used only before the farmer has
// captured a real GPS location - once coords exist, CreateListing
// computes live distance via utils/geo.js instead of reading this.
//
// Coverage expanded beyond the original south-Karnataka cluster
// (Mandya/Maddur/Ramanagara/Bengaluru) so nearest-APMC results are
// meaningful for farmers anywhere in the state, not just that region.
export const apmcMarkets = [
  { id: 'mandya', name: 'Mandya APMC', district: 'Mandya', state: 'Karnataka', location: { lat: 12.5242, lng: 76.8958 }, distanceKm: 2.3 },
  { id: 'maddur', name: 'Maddur APMC', district: 'Mandya', state: 'Karnataka', location: { lat: 12.5847, lng: 77.0419 }, distanceKm: 18.6 },
  { id: 'ramanagara', name: 'Ramanagara APMC', district: 'Ramanagara', state: 'Karnataka', location: { lat: 12.7217, lng: 77.2812 }, distanceKm: 46.4 },
  { id: 'bengaluru', name: 'Bengaluru APMC', district: 'Bengaluru', state: 'Karnataka', location: { lat: 12.9716, lng: 77.5946 }, distanceKm: 101 },
  { id: 'mysuru', name: 'Mysuru APMC', district: 'Mysuru', state: 'Karnataka', location: { lat: 12.2958, lng: 76.6394 }, distanceKm: 40 },
  { id: 'hassan', name: 'Hassan APMC', district: 'Hassan', state: 'Karnataka', location: { lat: 13.0072, lng: 76.0962 }, distanceKm: 90 },
  { id: 'tumakuru', name: 'Tumakuru APMC', district: 'Tumakuru', state: 'Karnataka', location: { lat: 13.3379, lng: 77.1173 }, distanceKm: 130 },
  { id: 'shivamogga', name: 'Shivamogga APMC', district: 'Shivamogga', state: 'Karnataka', location: { lat: 13.9299, lng: 75.5681 }, distanceKm: 220 },
  { id: 'mangaluru', name: 'Mangaluru APMC', district: 'Dakshina Kannada', state: 'Karnataka', location: { lat: 12.9141, lng: 74.8560 }, distanceKm: 220 },
  { id: 'hubli', name: 'Hubballi APMC', district: 'Dharwad', state: 'Karnataka', location: { lat: 15.3647, lng: 75.1240 }, distanceKm: 330 },
  { id: 'kalaburagi', name: 'Kalaburagi APMC', district: 'Kalaburagi', state: 'Karnataka', location: { lat: 17.3297, lng: 76.8343 }, distanceKm: 430 },
  { id: 'belagavi', name: 'Belagavi APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 15.8497, lng: 74.4977 }, distanceKm: 480 },
  { id: 'chikodi', name: 'Chikodi APMC', district: 'Belagavi', state: 'Karnataka', location: { lat: 16.4326, lng: 74.5814 }, distanceKm: 500 },
];

export const nearestApmcId = 'mandya';
