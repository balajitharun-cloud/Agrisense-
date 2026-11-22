export const LISTING_CATEGORIES = ['seeds', 'fertiliser', 'crop-protection', 'tools'];

export const LISTINGS = [
  { id: 'l1', title: 'Arka Rakshak Tomato Seed (10 g)', category: 'seeds', crop: 'tomato', price: 480, unit: 'packet', seller: 'Sri Vagdevi Seeds', location: 'Kolar, Karnataka', rating: 4.6, stock: 122 },
  { id: 'l2', title: 'Sona Masuri Paddy Seed (25 kg)', category: 'seeds', crop: 'paddy', price: 1450, unit: 'bag', seller: 'Mandya Farm Supply', location: 'Mandya, Karnataka', rating: 4.3, stock: 54 },
  { id: 'l3', title: 'Ragi (GPU-28) Certified Seed (10 kg)', category: 'seeds', crop: 'ragi', price: 620, unit: 'bag', seller: 'Sri Vagdevi Seeds', location: 'Bengaluru Rural, Karnataka', rating: 4.5, stock: 88 },
  { id: 'l4', title: 'Urea 46% N (45 kg)', category: 'fertiliser', crop: null, price: 298, unit: 'bag', seller: 'Krishi Kendra Hubli', location: 'Dharwad, Karnataka', rating: 4.1, stock: 310 },
  { id: 'l5', title: 'DAP 18:46:0 (50 kg)', category: 'fertiliser', crop: null, price: 1330, unit: 'bag', seller: 'Krishi Kendra Hubli', location: 'Dharwad, Karnataka', rating: 4.2, stock: 145 },
  { id: 'l6', title: 'MOP Muriate of Potash (50 kg)', category: 'fertiliser', crop: null, price: 1720, unit: 'bag', seller: 'Belagavi Agro Mart', location: 'Belagavi, Karnataka', rating: 4.0, stock: 96 },
  { id: 'l7', title: 'FYM Vermicompost (50 kg)', category: 'fertiliser', crop: null, price: 340, unit: 'bag', seller: 'Green Soil Organics', location: 'Mysuru, Karnataka', rating: 4.7, stock: 210 },
  { id: 'l8', title: 'Emamectin Benzoate 5% SG (100 g)', category: 'crop-protection', crop: 'maize', price: 395, unit: 'pouch', seller: 'Safal Crop Care', location: 'Kalaburagi, Karnataka', rating: 4.4, stock: 67 },
  { id: 'l9', title: 'Imidacloprid 17.8% SL (250 ml)', category: 'crop-protection', crop: 'paddy', price: 512, unit: 'bottle', seller: 'Safal Crop Care', location: 'Raichur, Karnataka', rating: 4.2, stock: 40 },
  { id: 'l10', title: 'Hand-operated Knapsack Sprayer 16 L', category: 'tools', crop: null, price: 2350, unit: 'piece', seller: 'Ravi Implements', location: 'Tumakuru, Karnataka', rating: 4.5, stock: 18 },
  { id: 'l11', title: 'Drip lateral 16 mm (400 m roll)', category: 'tools', crop: null, price: 4100, unit: 'roll', seller: 'NeerFlow Irrigation', location: 'Bengaluru, Karnataka', rating: 4.3, stock: 9 },
  { id: 'l12', title: 'Seedling Tray Set (50 pcs)', category: 'tools', crop: 'tomato', price: 890, unit: 'set', seller: 'Green Soil Organics', location: 'Mysuru, Karnataka', rating: 4.1, stock: 35 },
  { id: 'l13', title: 'BG-1 Neem Oil 1 L (cold pressed)', category: 'crop-protection', crop: null, price: 340, unit: 'bottle', seller: 'Green Soil Organics', location: 'Hassan, Karnataka', rating: 4.6, stock: 150 },
  { id: 'l14', title: 'Maize Hybrid CP-838 Seed (5 kg)', category: 'seeds', crop: 'maize', price: 1120, unit: 'bag', seller: 'Safal Crop Care', location: 'Bidar, Karnataka', rating: 4.4, stock: 72 }
];

export const COMMODITIES = [
  { id: 'c1', commodity: 'Ragi (finger millet)', variety: 'Local', market: 'Hassan APMC', unit: 'quintal', price: 3245, prevPrice: 3210, grade: 'FAQ' },
  { id: 'c2', commodity: 'Paddy', variety: 'Sona Masuri', market: 'Mandya APMC', unit: 'quintal', price: 2810, prevPrice: 2765, grade: 'Common' },
  { id: 'c3', commodity: 'Maize', variety: 'Hybrid', market: 'Davangere APMC', unit: 'quintal', price: 2090, prevPrice: 2145, grade: 'FAQ' },
  { id: 'c4', commodity: 'Cotton', variety: 'Kapas', market: 'Raichur APMC', unit: 'quintal', price: 7020, prevPrice: 6915, grade: 'FAQ' },
  { id: 'c5', commodity: 'Groundnut', variety: 'TMV-2', market: 'Chitradurga APMC', unit: 'quintal', price: 5890, prevPrice: 5890, grade: 'FAQ' },
  { id: 'c6', commodity: 'Tomato', variety: 'Hybrid', market: 'Kolar APMC', unit: 'quintal', price: 1825, prevPrice: 2110, grade: 'A' },
  { id: 'c7', commodity: 'Onion', variety: 'Bellary Red', market: 'Hassan APMC', unit: 'quintal', price: 1650, prevPrice: 1580, grade: 'A' },
  { id: 'c8', commodity: 'Tur Dal (pigeonpea)', variety: 'Local', market: 'Kalaburagi APMC', unit: 'quintal', price: 7450, prevPrice: 7520, grade: 'FAQ' },
  { id: 'c9', commodity: 'Green Chilli', variety: 'G-4', market: 'Haveri APMC', unit: 'kg', price: 46, prevPrice: 41, grade: 'A' },
  { id: 'c10', commodity: 'Coconut', variety: 'Dehusked', market: 'Hassan APMC', unit: '1000 nuts', price: 14200, prevPrice: 13850, grade: 'A' }
];

export function listListings({ category, crop, q } = {}) {
  let out = LISTINGS;
  if (category && category !== 'all') out = out.filter((l) => l.category === category);
  if (crop && crop !== 'all') out = out.filter((l) => l.crop === crop || l.crop === null || l.crop === undefined);
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter((l) =>
      l.title.toLowerCase().includes(needle) ||
      l.seller.toLowerCase().includes(needle) ||
      l.location.toLowerCase().includes(needle)
    );
  }
  return out;
}

export function listPrices() {
  return COMMODITIES.map((c) => ({
    ...c,
    change: c.price - c.prevPrice,
    changePct: Math.round(((c.price - c.prevPrice) / c.prevPrice) * 1000) / 10
  }));
}
