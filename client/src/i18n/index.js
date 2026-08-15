import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import enNavigation from '../locales/en/navigation.json';
import enWeather from '../locales/en/weather.json';
import enMarketPrices from '../locales/en/marketPrices.json';
import enListings from '../locales/en/listings.json';
import enBuyCrops from '../locales/en/buyCrops.json';
import enAuth from '../locales/en/auth.json';
import enShops from '../locales/en/shops.json';
import enGovSchemes from '../locales/en/govSchemes.json';
import enAnimals from '../locales/en/animals.json';
import enAgroAI from '../locales/en/agroAI.json';
import enEquipment from '../locales/en/equipment.json';
import knCommon from '../locales/kn/common.json';
import knNavigation from '../locales/kn/navigation.json';
import knWeather from '../locales/kn/weather.json';
import knMarketPrices from '../locales/kn/marketPrices.json';
import knListings from '../locales/kn/listings.json';
import knBuyCrops from '../locales/kn/buyCrops.json';
import knAuth from '../locales/kn/auth.json';
import knShops from '../locales/kn/shops.json';
import knGovSchemes from '../locales/kn/govSchemes.json';
import knAnimals from '../locales/kn/animals.json';
import knAgroAI from '../locales/kn/agroAI.json';
import knEquipment from '../locales/kn/equipment.json';
import mixCommon from '../locales/mix/common.json';
import mixNavigation from '../locales/mix/navigation.json';
import mixWeather from '../locales/mix/weather.json';
import mixMarketPrices from '../locales/mix/marketPrices.json';
import mixListings from '../locales/mix/listings.json';
import mixBuyCrops from '../locales/mix/buyCrops.json';
import mixAuth from '../locales/mix/auth.json';
import mixShops from '../locales/mix/shops.json';
import mixGovSchemes from '../locales/mix/govSchemes.json';
import mixAnimals from '../locales/mix/animals.json';
import mixAgroAI from '../locales/mix/agroAI.json';
import mixEquipment from '../locales/mix/equipment.json';

// Supported locales. 'mix' is a first-class locale (not a runtime
// conditional) so mixed-language labels live in their own translation
// files and never require language-branching logic in components.
export const SUPPORTED_LOCALES = ['mix', 'kn', 'en'];
export const DEFAULT_LOCALE = 'mix';

const resources = {
  en: { common: enCommon, navigation: enNavigation, weather: enWeather, marketPrices: enMarketPrices, listings: enListings, buyCrops: enBuyCrops, auth: enAuth, shops: enShops, govSchemes: enGovSchemes, animals: enAnimals, agroAI: enAgroAI, equipment: enEquipment },
  kn: { common: knCommon, navigation: knNavigation, weather: knWeather, marketPrices: knMarketPrices, listings: knListings, buyCrops: knBuyCrops, auth: knAuth, shops: knShops, govSchemes: knGovSchemes, animals: knAnimals, agroAI: knAgroAI, equipment: knEquipment },
  mix: { common: mixCommon, navigation: mixNavigation, weather: mixWeather, marketPrices: mixMarketPrices, listings: mixListings, buyCrops: mixBuyCrops, auth: mixAuth, shops: mixShops, govSchemes: mixGovSchemes, animals: mixAnimals, agroAI: mixAgroAI, equipment: mixEquipment },
};

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: ['mix', 'kn', 'en'],
  defaultNS: 'common',
  ns: ['common', 'navigation', 'weather', 'marketPrices', 'listings', 'buyCrops', 'auth', 'shops', 'govSchemes', 'animals', 'agroAI'],
  interpolation: {
    escapeValue: false, // React already escapes output
  },
  returnEmptyString: false,
});

export default i18n;
