/**
 * Frozen data contract — Bangladesh-specific market taxonomy (owner-approved 2026-10-22).
 * Architect-seeded; see .jules/spec.md and GLOSSARY.md. Only the owning task may fix errors.
 *
 * Provenance of refPricePaisa: 'DAM-2026-10' = retail level read from the Department of
 * Agricultural Marketing daily price report (market.dam.gov.bd, October 2026); 'estimate' =
 * architect estimate at the same retail level, cross-checked against AgriPriceBD dataset ranges.
 * Every price cell is owner-editable data; nothing in code depends on a specific value.
 *
 * Freshness windows (primeDays/okDays) are real-world post-harvest shelf life at ambient
 * Bangladesh conditions: prime = best eating window, ok = still marketable with the amber badge.
 * months = peak harvest months (Gregorian, 1-12) driving Fair-price season multipliers; null =
 * available year-round. avgKg = kg per piece; bundleKg/basketKg/sackKg = kg per আঁটি/ঝুড়ি/বস্তা.
 */

export type UnitId = 'kg' | 'pc' | 'hali' | 'dozen' | 'aati' | 'jhuri' | 'bosta' | 'litre' | 'maund';
export type GroupId =
  | 'leafy' | 'vegetable' | 'fruit' | 'fish' | 'grain' | 'pulse' | 'dairy' | 'spice' | 'special';
export type PriceSource = 'DAM-2026-10' | 'estimate';

export interface Group { id: GroupId; bn: string; en: string; }

export interface Category {
  id: string;
  group: GroupId;
  bn: string;
  en: string;
  units: UnitId[];          // allowed units; first entry is the default
  primeDays: number;        // freshness: harvest → prime window (days)
  okDays: number;           // freshness: harvest → marketable window (days); best-before = harvest + okDays
  months: number[] | null;  // peak harvest months; null = year-round
  avgKg: number | null;     // kg per piece (count unit conversion)
  bundleKg?: number;        // kg per আঁটি (leafy bundles)
  basketKg?: number;        // kg per ঝুড়ি
  sackKg?: number;          // kg per বস্তা
  refPricePaisa: number;    // fair retail reference price per DEFAULT unit
  source: PriceSource;
}

/** ১ মণ = 40 kg — live Bangladesh bazaar convention (spec; historical metric maund was 37.3242 kg). */
export const MAUND_KG = 40;

/** Density factors for volume units (litre → kg-equivalent), by group. */
export const LITRE_KG: Partial<Record<GroupId, number>> = { dairy: 1.03, spice: 0.92, special: 0.92 };

export const GROUPS: Group[] = [
  { id: 'leafy', bn: 'শাক ও সুগন্ধি পাতা', en: 'Leafy greens & herbs' },
  { id: 'vegetable', bn: 'সবজি', en: 'Vegetables' },
  { id: 'fruit', bn: 'ফল', en: 'Fruits' },
  { id: 'fish', bn: 'মাছ ও জলজ', en: 'Fish & aquatic' },
  { id: 'grain', bn: 'ধান ও শস্য', en: 'Grains & cereals' },
  { id: 'pulse', bn: 'ডাল', en: 'Pulses' },
  { id: 'dairy', bn: 'দুগ্ধ, ডিম ও পশুজাত', en: 'Dairy, eggs & animal products' },
  { id: 'spice', bn: 'মসলা ও সুগন্ধি', en: 'Spices & aromatics' },
  { id: 'special', bn: 'তেল, মিষ্টান্ন ও বিশেষ পণ্য', en: 'Oils, sweeteners & specialties' },
];

export const CATEGORIES: Category[] = [
  // ---- ১. শাক ও সুগন্ধি পাতা (leafy) — sold by আঁটি (bundle) or kg; very short windows ----
  { id: 'palong-shak', group: 'leafy', bn: 'পালং শাক', en: 'Spinach', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [10, 11, 12, 1], avgKg: null, bundleKg: 0.4, refPricePaisa: 2500, source: 'estimate' },
  { id: 'lal-shak', group: 'leafy', bn: 'লাল শাক', en: 'Amaranth leaves', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [6, 7, 8, 9], avgKg: null, bundleKg: 0.4, refPricePaisa: 2000, source: 'estimate' },
  { id: 'kolmi-shak', group: 'leafy', bn: 'কলমি শাক', en: 'Water spinach', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [6, 7, 8, 9, 10], avgKg: null, bundleKg: 0.4, refPricePaisa: 2000, source: 'estimate' },
  { id: 'pui-shak', group: 'leafy', bn: 'পুঁই শাক', en: 'Malabar spinach', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [7, 8, 9, 10], avgKg: null, bundleKg: 0.4, refPricePaisa: 2500, source: 'estimate' },
  { id: 'data-shak', group: 'leafy', bn: 'ডাটা শাক', en: 'Jute leaves', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [6, 7, 8, 9], avgKg: null, bundleKg: 0.4, refPricePaisa: 2000, source: 'estimate' },
  { id: 'kachu-shak', group: 'leafy', bn: 'কচু শাক', en: 'Taro leaves', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: null, avgKg: null, bundleKg: 0.4, refPricePaisa: 2000, source: 'estimate' },
  { id: 'sajne-pata', group: 'leafy', bn: 'সাজনে পাতা', en: 'Moringa leaves', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: null, avgKg: null, bundleKg: 0.3, refPricePaisa: 3000, source: 'estimate' },
  { id: 'thankuni', group: 'leafy', bn: 'থানকুনি', en: 'Pennywort', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: null, avgKg: null, bundleKg: 0.3, refPricePaisa: 2500, source: 'estimate' },
  { id: 'pudina', group: 'leafy', bn: 'পুদিনা', en: 'Mint', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: null, avgKg: null, bundleKg: 0.2, refPricePaisa: 1500, source: 'estimate' },
  { id: 'dhonia-pata', group: 'leafy', bn: 'ধনিয়া পাতা', en: 'Coriander leaves', units: ['aati', 'kg'], primeDays: 1, okDays: 3, months: [10, 11, 12, 1, 2], avgKg: null, bundleKg: 0.2, refPricePaisa: 2000, source: 'estimate' },

  // ---- ২. সবজি (vegetable) ----
  { id: 'tomato', group: 'vegetable', bn: 'টমেটো', en: 'Tomato', units: ['kg', 'jhuri'], primeDays: 2, okDays: 5, months: [10, 11, 12, 1, 2, 3], avgKg: null, basketKg: 4.5, refPricePaisa: 5000, source: 'estimate' },
  { id: 'begun', group: 'vegetable', bn: 'বেগুন', en: 'Brinjal', units: ['kg', 'pc', 'jhuri'], primeDays: 2, okDays: 4, months: null, avgKg: 0.25, basketKg: 4.5, refPricePaisa: 4500, source: 'estimate' },
  { id: 'dherosh', group: 'vegetable', bn: 'ঢেঁড়স', en: 'Okra', units: ['kg', 'jhuri'], primeDays: 1, okDays: 3, months: [6, 7, 8, 9], avgKg: null, basketKg: 4.5, refPricePaisa: 6000, source: 'estimate' },
  { id: 'korola', group: 'vegetable', bn: 'করলা', en: 'Bitter gourd', units: ['kg', 'jhuri'], primeDays: 3, okDays: 7, months: null, avgKg: null, basketKg: 4.5, refPricePaisa: 5500, source: 'estimate' },
  { id: 'jhinga', group: 'vegetable', bn: 'ঝিঙে', en: 'Ridge gourd', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [7, 8, 9, 10], avgKg: 0.4, refPricePaisa: 4500, source: 'estimate' },
  { id: 'chichinga', group: 'vegetable', bn: 'চিচিঙ্গা', en: 'Snake gourd', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [7, 8, 9, 10], avgKg: 0.6, refPricePaisa: 4500, source: 'estimate' },
  { id: 'potol', group: 'vegetable', bn: 'পটল', en: 'Pointed gourd', units: ['kg', 'jhuri'], primeDays: 2, okDays: 5, months: [5, 6, 7, 8], avgKg: null, basketKg: 4.5, refPricePaisa: 6500, source: 'estimate' },
  { id: 'uchchhe', group: 'vegetable', bn: 'উচ্ছে', en: 'Teasel gourd', units: ['kg'], primeDays: 3, okDays: 7, months: [6, 7, 8, 9], avgKg: null, refPricePaisa: 5000, source: 'estimate' },
  { id: 'kakrol', group: 'vegetable', bn: 'কাকরোল', en: 'Gherkin', units: ['kg'], primeDays: 3, okDays: 7, months: [6, 7, 8, 9], avgKg: null, refPricePaisa: 5500, source: 'estimate' },
  { id: 'shim', group: 'vegetable', bn: 'শিম', en: 'French beans', units: ['kg'], primeDays: 2, okDays: 5, months: [11, 12, 1, 2], avgKg: null, refPricePaisa: 6000, source: 'estimate' },
  { id: 'borboti', group: 'vegetable', bn: 'বরবটি', en: 'Yard-long beans', units: ['kg'], primeDays: 2, okDays: 5, months: [4, 5, 6, 7, 8], avgKg: null, refPricePaisa: 5500, source: 'estimate' },
  { id: 'motor-shuti', group: 'vegetable', bn: 'মটর শুঁটি', en: 'Green peas', units: ['kg'], primeDays: 1, okDays: 3, months: [12, 1, 2], avgKg: null, refPricePaisa: 7000, source: 'estimate' },
  { id: 'kacha-morich', group: 'vegetable', bn: 'কাঁচা মরিচ', en: 'Green chili', units: ['kg'], primeDays: 2, okDays: 5, months: null, avgKg: null, refPricePaisa: 22800, source: 'DAM-2026-10' },
  { id: 'capsicum', group: 'vegetable', bn: 'ক্যাপসিকাম', en: 'Capsicum', units: ['kg', 'pc'], primeDays: 3, okDays: 7, months: [11, 12, 1, 2], avgKg: 0.15, refPricePaisa: 9000, source: 'estimate' },
  { id: 'lau', group: 'vegetable', bn: 'লাউ', en: 'Bottle gourd', units: ['pc', 'kg'], primeDays: 14, okDays: 30, months: [5, 6, 7, 8], avgKg: 2.0, refPricePaisa: 4000, source: 'estimate' },
  { id: 'misti-kumra', group: 'vegetable', bn: 'মিষ্টি কুমড়া', en: 'Sweet pumpkin', units: ['pc', 'kg'], primeDays: 30, okDays: 90, months: [9, 10, 11], avgKg: 2.5, refPricePaisa: 2200, source: 'estimate' },
  { id: 'chal-kumra', group: 'vegetable', bn: 'চাল কুমড়া', en: 'Ash gourd', units: ['pc', 'kg'], primeDays: 30, okDays: 90, months: [9, 10, 11], avgKg: 3.0, refPricePaisa: 1800, source: 'estimate' },
  { id: 'kacha-kathal', group: 'vegetable', bn: 'কাঁচা কাঠাল', en: 'Green jackfruit', units: ['pc', 'kg'], primeDays: 7, okDays: 14, months: [4, 5, 6], avgKg: 3.0, refPricePaisa: 3500, source: 'estimate' },
  { id: 'alu', group: 'vegetable', bn: 'আলু', en: 'Potato', units: ['kg', 'bosta', 'jhuri'], primeDays: 30, okDays: 90, months: [1, 2, 3], avgKg: null, basketKg: 4.5, sackKg: 50, refPricePaisa: 3200, source: 'estimate' },
  { id: 'misti-alu', group: 'vegetable', bn: 'মিষ্টি আলু', en: 'Sweet potato', units: ['kg', 'jhuri'], primeDays: 14, okDays: 30, months: [10, 11, 12], avgKg: null, basketKg: 4.5, refPricePaisa: 4500, source: 'estimate' },
  { id: 'gajor', group: 'vegetable', bn: 'গাজর', en: 'Carrot', units: ['kg', 'jhuri'], primeDays: 5, okDays: 10, months: [11, 12, 1, 2], avgKg: null, basketKg: 4.5, refPricePaisa: 5000, source: 'estimate' },
  { id: 'mula', group: 'vegetable', bn: 'মূলা', en: 'Radish', units: ['kg', 'aati'], primeDays: 3, okDays: 7, months: [10, 11, 12, 1], avgKg: null, bundleKg: 0.5, refPricePaisa: 3000, source: 'estimate' },
  { id: 'beet', group: 'vegetable', bn: 'বিট', en: 'Beetroot', units: ['kg', 'pc'], primeDays: 7, okDays: 14, months: [11, 12, 1], avgKg: 0.2, refPricePaisa: 6000, source: 'estimate' },
  { id: 'kachu', group: 'vegetable', bn: 'কচু', en: 'Taro', units: ['kg', 'jhuri'], primeDays: 14, okDays: 30, months: null, avgKg: null, basketKg: 4.5, refPricePaisa: 4500, source: 'estimate' },
  { id: 'mukhi-kachu', group: 'vegetable', bn: 'মুখী কচু', en: 'Mukhi taro', units: ['kg', 'jhuri'], primeDays: 14, okDays: 30, months: null, avgKg: null, basketKg: 4.5, refPricePaisa: 4000, source: 'estimate' },
  { id: 'ol', group: 'vegetable', bn: 'ওল', en: 'Elephant foot yam', units: ['kg', 'pc'], primeDays: 14, okDays: 30, months: [10, 11, 12], avgKg: 1.5, refPricePaisa: 5000, source: 'estimate' },
  { id: 'shalgom', group: 'vegetable', bn: 'শালগম', en: 'Turnip', units: ['kg'], primeDays: 10, okDays: 21, months: [11, 12, 1], avgKg: null, refPricePaisa: 5500, source: 'estimate' },
  { id: 'fulkopi', group: 'vegetable', bn: 'ফুলকপি', en: 'Cauliflower', units: ['kg', 'pc'], primeDays: 3, okDays: 7, months: [11, 12, 1], avgKg: 0.8, refPricePaisa: 5500, source: 'estimate' },
  { id: 'badhakopi', group: 'vegetable', bn: 'বাঁধাকপি', en: 'Cabbage', units: ['kg', 'pc'], primeDays: 5, okDays: 10, months: [11, 12, 1, 2], avgKg: 1.0, refPricePaisa: 4000, source: 'estimate' },
  { id: 'broccoli', group: 'vegetable', bn: 'ব্রকলি', en: 'Broccoli', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [11, 12, 1], avgKg: 0.4, refPricePaisa: 12000, source: 'estimate' },
  { id: 'shosha', group: 'vegetable', bn: 'শসা', en: 'Cucumber', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [4, 5, 6, 7], avgKg: 0.2, refPricePaisa: 4000, source: 'estimate' },
  { id: 'kacha-pepe', group: 'vegetable', bn: 'কাঁচা পেঁপে', en: 'Green papaya', units: ['kg', 'pc'], primeDays: 5, okDays: 10, months: null, avgKg: 0.8, refPricePaisa: 3500, source: 'estimate' },
  { id: 'misti-bhutta', group: 'vegetable', bn: 'মিষ্টি ভুট্টা', en: 'Sweet corn', units: ['pc', 'kg'], primeDays: 0, okDays: 2, months: [3, 4, 9], avgKg: 0.35, refPricePaisa: 1500, source: 'estimate' },
  { id: 'kacha-kola', group: 'vegetable', bn: 'কাঁচা কলা', en: 'Green plantain', units: ['pc', 'hali', 'kg'], primeDays: 5, okDays: 10, months: null, avgKg: 0.15, refPricePaisa: 1200, source: 'estimate' },

  // ---- ৩. ফল (fruit) ----
  { id: 'am', group: 'fruit', bn: 'আম', en: 'Mango', units: ['kg', 'pc', 'jhuri'], primeDays: 2, okDays: 5, months: [5, 6, 7], avgKg: 0.3, basketKg: 4.5, refPricePaisa: 10000, source: 'estimate' },
  { id: 'kathal', group: 'fruit', bn: 'কাঠাল', en: 'Jackfruit', units: ['pc', 'kg'], primeDays: 3, okDays: 7, months: [6, 7, 8], avgKg: 3.5, refPricePaisa: 12000, source: 'estimate' },
  { id: 'lichu', group: 'fruit', bn: 'লিচু', en: 'Lychee', units: ['kg', 'pc'], primeDays: 1, okDays: 3, months: [5, 6], avgKg: 0.02, refPricePaisa: 13000, source: 'estimate' },
  { id: 'kola', group: 'fruit', bn: 'কলা', en: 'Banana', units: ['pc', 'hali', 'dozen'], primeDays: 2, okDays: 5, months: null, avgKg: 0.12, refPricePaisa: 1200, source: 'estimate' },
  { id: 'paka-pepe', group: 'fruit', bn: 'পাকা পেঁপে', en: 'Ripe papaya', units: ['kg', 'pc'], primeDays: 2, okDays: 4, months: null, avgKg: 0.9, refPricePaisa: 4500, source: 'estimate' },
  { id: 'peyara', group: 'fruit', bn: 'পেয়ারা', en: 'Guava', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [8, 9, 10], avgKg: 0.15, refPricePaisa: 7000, source: 'estimate' },
  { id: 'anarosh', group: 'fruit', bn: 'আনারস', en: 'Pineapple', units: ['pc', 'kg'], primeDays: 3, okDays: 7, months: [6, 7, 8], avgKg: 0.9, refPricePaisa: 5000, source: 'estimate' },
  { id: 'tormuj', group: 'fruit', bn: 'তরমুজ', en: 'Watermelon', units: ['pc', 'kg'], primeDays: 7, okDays: 14, months: [3, 4, 5], avgKg: 3.0, refPricePaisa: 4500, source: 'estimate' },
  { id: 'dab', group: 'fruit', bn: 'ডাব', en: 'Green coconut', units: ['pc'], primeDays: 5, okDays: 10, months: null, avgKg: 0.9, refPricePaisa: 3500, source: 'estimate' },
  { id: 'narikel', group: 'fruit', bn: 'নারিকেল', en: 'Coconut', units: ['pc', 'kg'], primeDays: 30, okDays: 60, months: null, avgKg: 1.0, refPricePaisa: 3000, source: 'estimate' },
  { id: 'kagoji-lebu', group: 'fruit', bn: 'কাগজি লেবু', en: 'Kagoji lime', units: ['pc', 'kg'], primeDays: 7, okDays: 21, months: null, avgKg: 0.04, refPricePaisa: 800, source: 'estimate' },
  { id: 'batabi-lebu', group: 'fruit', bn: 'বাতাবি লেবু', en: 'Pomelo', units: ['pc'], primeDays: 14, okDays: 30, months: [9, 10, 11], avgKg: 0.8, refPricePaisa: 3500, source: 'estimate' },
  { id: 'boroi', group: 'fruit', bn: 'বরই', en: 'Jujube', units: ['kg', 'pc'], primeDays: 1, okDays: 3, months: [12, 1, 2], avgKg: 0.02, refPricePaisa: 9000, source: 'estimate' },
  { id: 'amra', group: 'fruit', bn: 'আমড়া', en: 'Hog plum', units: ['kg', 'pc'], primeDays: 3, okDays: 7, months: [5, 6, 7], avgKg: 0.05, refPricePaisa: 6000, source: 'estimate' },
  { id: 'jalpai', group: 'fruit', bn: 'জলপাই', en: 'Olive', units: ['kg', 'pc'], primeDays: 5, okDays: 10, months: [9, 10, 11], avgKg: 0.01, refPricePaisa: 7000, source: 'estimate' },
  { id: 'kamranga', group: 'fruit', bn: 'কামরাঙা', en: 'Star fruit', units: ['kg', 'pc'], primeDays: 3, okDays: 7, months: [8, 9, 10], avgKg: 0.1, refPricePaisa: 5000, source: 'estimate' },
  { id: 'ata', group: 'fruit', bn: 'আতা', en: 'Custard apple', units: ['kg', 'pc'], primeDays: 1, okDays: 3, months: [8, 9], avgKg: 0.2, refPricePaisa: 9000, source: 'estimate' },
  { id: 'lotkon', group: 'fruit', bn: 'লটকন', en: 'Latkan', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [5, 6], avgKg: 0.02, refPricePaisa: 14000, source: 'estimate' },
  { id: 'bel', group: 'fruit', bn: 'বেল', en: 'Wood apple', units: ['pc', 'kg'], primeDays: 5, okDays: 10, months: [4, 5, 6], avgKg: 0.6, refPricePaisa: 3000, source: 'estimate' },
  { id: 'shafeda', group: 'fruit', bn: 'সফেদা', en: 'Sapodilla', units: ['kg', 'pc'], primeDays: 3, okDays: 7, months: [12, 1, 2], avgKg: 0.08, refPricePaisa: 8000, source: 'estimate' },

  // ---- ৪. মাছ ও জলজ (fish) — fresh is same-day truth: 0/1 windows ----
  { id: 'rui', group: 'fish', bn: 'রুই', en: 'Rohu', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 1.5, refPricePaisa: 26000, source: 'estimate' },
  { id: 'katla', group: 'fish', bn: 'কাতলা', en: 'Catla', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 2.0, refPricePaisa: 32000, source: 'estimate' },
  { id: 'mrigel', group: 'fish', bn: 'মৃগেল', en: 'Mrigal', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 1.2, refPricePaisa: 24000, source: 'estimate' },
  { id: 'pangash', group: 'fish', bn: 'পাংগাস', en: 'Pangas', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 2.0, refPricePaisa: 18000, source: 'estimate' },
  { id: 'telapia', group: 'fish', bn: 'তেলাপিয়া', en: 'Tilapia', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.5, refPricePaisa: 16000, source: 'estimate' },
  { id: 'koi', group: 'fish', bn: 'কই', en: 'Climbing perch', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.1, refPricePaisa: 42000, source: 'estimate' },
  { id: 'shingi', group: 'fish', bn: 'শিং', en: 'Spiny eel', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.08, refPricePaisa: 55000, source: 'estimate' },
  { id: 'magur', group: 'fish', bn: 'মাগুর', en: 'Walking catfish', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.15, refPricePaisa: 48000, source: 'estimate' },
  { id: 'boal', group: 'fish', bn: 'বোয়াল', en: 'Boal', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 2.5, refPricePaisa: 40000, source: 'estimate' },
  { id: 'ilish', group: 'fish', bn: 'ইলিশ', en: 'Hilsa', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: [9, 10, 11, 2, 3], avgKg: 1.2, refPricePaisa: 160000, source: 'estimate' },
  { id: 'rupchanda', group: 'fish', bn: 'রূপচাঁদা', en: 'Pomfret', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.4, refPricePaisa: 90000, source: 'estimate' },
  { id: 'loitta', group: 'fish', bn: 'লইট্যা', en: 'Bombay duck', units: ['kg'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 40000, source: 'estimate' },
  { id: 'bata', group: 'fish', bn: 'বাটা', en: 'Bata', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 0.2, refPricePaisa: 25000, source: 'estimate' },
  { id: 'korol', group: 'fish', bn: 'কোরাল', en: 'Wallago', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: null, avgKg: 1.5, refPricePaisa: 35000, source: 'estimate' },
  { id: 'golda-chingri', group: 'fish', bn: 'গলদা চিংড়ি', en: 'Freshwater prawn', units: ['kg'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 95000, source: 'estimate' },
  { id: 'bagda-chingri', group: 'fish', bn: 'বাগদা চিংড়ি', en: 'Black tiger shrimp', units: ['kg'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 85000, source: 'estimate' },
  { id: 'choto-chingri', group: 'fish', bn: 'ছোট চিংড়ি', en: 'Small shrimp', units: ['kg'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 50000, source: 'estimate' },
  { id: 'kakra', group: 'fish', bn: 'কাঁকড়া', en: 'Crab', units: ['kg', 'pc'], primeDays: 0, okDays: 1, months: [8, 9, 10], avgKg: 0.3, refPricePaisa: 60000, source: 'estimate' },
  { id: 'shutki', group: 'fish', bn: 'শুঁটকি', en: 'Dried fish', units: ['kg'], primeDays: 60, okDays: 180, months: null, avgKg: null, refPricePaisa: 90000, source: 'estimate' },

  // ---- ৫. ধান ও শস্য (grain) — wholesale units মণ/বস্তা; long windows ----
  { id: 'dhan', group: 'grain', bn: 'ধান', en: 'Paddy', units: ['maund', 'bosta', 'kg'], primeDays: 120, okDays: 365, months: [4, 5, 7, 8, 11, 12], avgKg: null, sackKg: 40, refPricePaisa: 4000, source: 'estimate' },
  { id: 'chal', group: 'grain', bn: 'চাল', en: 'Rice', units: ['kg', 'maund', 'bosta'], primeDays: 90, okDays: 270, months: null, avgKg: null, sackKg: 40, refPricePaisa: 6200, source: 'DAM-2026-10' },
  { id: 'sugondhi-chal', group: 'grain', bn: 'সুগন্ধি চাল', en: 'Aromatic rice', units: ['kg', 'maund'], primeDays: 90, okDays: 270, months: [11, 12], avgKg: null, refPricePaisa: 9000, source: 'estimate' },
  { id: 'gom', group: 'grain', bn: 'গম', en: 'Wheat', units: ['kg', 'maund', 'bosta'], primeDays: 90, okDays: 270, months: [3, 4], avgKg: null, sackKg: 50, refPricePaisa: 3800, source: 'estimate' },
  { id: 'shukna-bhutta', group: 'grain', bn: 'শুকনা ভুট্টা', en: 'Dried maize', units: ['kg', 'maund'], primeDays: 90, okDays: 270, months: [3, 4, 9], avgKg: null, refPricePaisa: 3000, source: 'estimate' },

  // ---- ৬. ডাল (pulse) ----
  { id: 'mashur', group: 'pulse', bn: 'মসুর ডাল', en: 'Lentil', units: ['kg', 'maund'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 12000, source: 'estimate' },
  { id: 'moog', group: 'pulse', bn: 'মুগ ডাল', en: 'Mung bean', units: ['kg', 'maund'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 12500, source: 'DAM-2026-10' },
  { id: 'orhor', group: 'pulse', bn: 'অড়হর ডাল', en: 'Pigeon pea', units: ['kg', 'maund'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 14000, source: 'estimate' },
  { id: 'chola', group: 'pulse', bn: 'ছোলা', en: 'Chickpea', units: ['kg', 'maund'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 8800, source: 'DAM-2026-10' },
  { id: 'mash-kalai', group: 'pulse', bn: 'মাষ কলাই', en: 'Black gram', units: ['kg'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 13000, source: 'estimate' },
  { id: 'khesari', group: 'pulse', bn: 'খেসারি ডাল', en: 'Grass pea', units: ['kg', 'maund'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 11000, source: 'estimate' },
  { id: 'shukna-motor', group: 'pulse', bn: 'শুকনা মটর', en: 'Dried peas', units: ['kg'], primeDays: 120, okDays: 365, months: null, avgKg: null, refPricePaisa: 10000, source: 'estimate' },

  // ---- ৭. দুগ্ধ, ডিম ও পশুজাত (dairy) ----
  { id: 'gorur-dudh', group: 'dairy', bn: 'গরুর দুধ', en: 'Cow milk', units: ['litre'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 9000, source: 'estimate' },
  { id: 'chhana', group: 'dairy', bn: 'ছানা', en: 'Cottage cheese', units: ['kg'], primeDays: 0, okDays: 1, months: null, avgKg: null, refPricePaisa: 70000, source: 'estimate' },
  { id: 'doi', group: 'dairy', bn: 'দই', en: 'Yogurt', units: ['kg', 'pc'], primeDays: 1, okDays: 3, months: null, avgKg: 0.5, refPricePaisa: 20000, source: 'estimate' },
  { id: 'ghi', group: 'dairy', bn: 'ঘি', en: 'Ghee', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 130000, source: 'estimate' },
  { id: 'murgir-dim', group: 'dairy', bn: 'মুরগির ডিম', en: 'Hen egg', units: ['pc', 'hali', 'dozen'], primeDays: 5, okDays: 10, months: null, avgKg: 0.06, refPricePaisa: 1200, source: 'DAM-2026-10' },
  { id: 'hasher-dim', group: 'dairy', bn: 'হাসের ডিম', en: 'Duck egg', units: ['pc', 'hali', 'dozen'], primeDays: 7, okDays: 14, months: null, avgKg: 0.07, refPricePaisa: 1500, source: 'estimate' },

  // ---- ৮. মসলা ও সুগন্ধি (spice) ----
  { id: 'peyaj', group: 'spice', bn: 'পেঁয়াজ', en: 'Onion', units: ['kg', 'bosta', 'jhuri'], primeDays: 14, okDays: 30, months: [3, 4, 9, 10], avgKg: null, basketKg: 4.5, sackKg: 50, refPricePaisa: 6200, source: 'DAM-2026-10' },
  { id: 'roshun', group: 'spice', bn: 'রসুন', en: 'Garlic', units: ['kg'], primeDays: 30, okDays: 60, months: [2, 3], avgKg: null, refPricePaisa: 18000, source: 'DAM-2026-10' },
  { id: 'ada', group: 'spice', bn: 'আদা', en: 'Ginger', units: ['kg'], primeDays: 14, okDays: 30, months: [11, 12, 1], avgKg: null, refPricePaisa: 16500, source: 'DAM-2026-10' },
  { id: 'kacha-holud', group: 'spice', bn: 'কাঁচা হলুদ', en: 'Fresh turmeric', units: ['kg'], primeDays: 14, okDays: 30, months: [12, 1, 2], avgKg: null, refPricePaisa: 12000, source: 'estimate' },
  { id: 'shukna-holud', group: 'spice', bn: 'শুকনা হলুদ', en: 'Dried turmeric', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 18000, source: 'estimate' },
  { id: 'shukna-morich', group: 'spice', bn: 'শুকনা মরিচ', en: 'Dried chili', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 30000, source: 'estimate' },
  { id: 'dhonia', group: 'spice', bn: 'ধনিয়া', en: 'Coriander seed', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 22000, source: 'estimate' },
  { id: 'jeera', group: 'spice', bn: 'জিরা', en: 'Cumin', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 48000, source: 'estimate' },
  { id: 'tejpat', group: 'spice', bn: 'তেজপাত', en: 'Bay leaf', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 40000, source: 'estimate' },
  { id: 'shorisha', group: 'spice', bn: 'সরিষা', en: 'Mustard seed', units: ['kg'], primeDays: 90, okDays: 270, months: [2, 3], avgKg: null, refPricePaisa: 20000, source: 'estimate' },
  { id: 'til', group: 'spice', bn: 'তিল', en: 'Sesame', units: ['kg'], primeDays: 60, okDays: 180, months: null, avgKg: null, refPricePaisa: 26000, source: 'estimate' },
  { id: 'gol-morich', group: 'spice', bn: 'গোল মরিচ', en: 'Black pepper', units: ['kg'], primeDays: 180, okDays: 540, months: null, avgKg: null, refPricePaisa: 90000, source: 'estimate' },
  { id: 'mouri', group: 'spice', bn: 'মৌরি', en: 'Fennel', units: ['kg'], primeDays: 90, okDays: 270, months: null, avgKg: null, refPricePaisa: 30000, source: 'estimate' },

  // ---- ৯. তেল, মিষ্টান্ন ও বিশেষ পণ্য (special) ----
  { id: 'shorishar-tel', group: 'special', bn: 'ঘানিভাঙা সরিষার তেল', en: 'Cold-pressed mustard oil', units: ['litre', 'kg'], primeDays: 90, okDays: 180, months: null, avgKg: null, refPricePaisa: 30000, source: 'estimate' },
  { id: 'narikel-tel', group: 'special', bn: 'নারিকেল তেল', en: 'Coconut oil', units: ['litre'], primeDays: 90, okDays: 180, months: null, avgKg: null, refPricePaisa: 35000, source: 'estimate' },
  { id: 'tiler-tel', group: 'special', bn: 'তিলের তেল', en: 'Sesame oil', units: ['litre'], primeDays: 90, okDays: 180, months: null, avgKg: null, refPricePaisa: 50000, source: 'estimate' },
  { id: 'modhu', group: 'special', bn: 'মধু', en: 'Honey', units: ['litre', 'kg'], primeDays: 365, okDays: 730, months: [3, 4, 5], avgKg: null, refPricePaisa: 150000, source: 'estimate' },
  { id: 'khejur-gur', group: 'special', bn: 'খেজুর গুড়', en: 'Date palm jaggery', units: ['kg', 'pc'], primeDays: 30, okDays: 90, months: [12, 1, 2], avgKg: 0.5, refPricePaisa: 40000, source: 'estimate' },
  { id: 'akh-gur', group: 'special', bn: 'আখ গুড়', en: 'Sugarcane jaggery', units: ['kg'], primeDays: 60, okDays: 180, months: [12, 1, 2], avgKg: null, refPricePaisa: 20000, source: 'estimate' },
  { id: 'akh', group: 'special', bn: 'আখ', en: 'Sugarcane', units: ['pc', 'kg'], primeDays: 3, okDays: 7, months: [12, 1, 2], avgKg: 1.5, refPricePaisa: 3000, source: 'estimate' },
  { id: 'bash-korol', group: 'special', bn: 'বাঁশের কোঁড়ল', en: 'Bamboo shoot', units: ['kg', 'pc'], primeDays: 2, okDays: 5, months: [6, 7, 8], avgKg: 0.8, refPricePaisa: 5000, source: 'estimate' },
  { id: 'paan', group: 'special', bn: 'পান', en: 'Betel leaf', units: ['pc', 'aati'], primeDays: 1, okDays: 3, months: null, avgKg: 0.005, bundleKg: 0.5, refPricePaisa: 800, source: 'estimate' },
  { id: 'cha-pata', group: 'special', bn: 'চা পাতা', en: 'Tea leaves', units: ['kg'], primeDays: 180, okDays: 540, months: [4, 5, 6, 7, 8], avgKg: null, refPricePaisa: 60000, source: 'estimate' },
];

export const categoriesById: ReadonlyMap<string, Category> = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  const c = categoriesById.get(id);
  if (!c) throw new Error(`unknown category: ${id}`);
  return c;
}
