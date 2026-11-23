const STATES = [
  {
    id: 'ka',
    name: 'Karnataka',
    zone: 'Southern Deccan Plateau',
    districts: [
      { id: 'ka-bengaluru-rural', name: 'Bengaluru Rural', lat: 13.23, lng: 77.58, zone: 'Eastern Dry Zone' },
      { id: 'ka-mysuru', name: 'Mysuru', lat: 12.3, lng: 76.64, zone: 'Southern Dry Zone' },
      { id: 'ka-belagavi', name: 'Belagavi', lat: 15.85, lng: 74.5, zone: 'Northern Transition Zone' },
      { id: 'ka-kalaburagi', name: 'Kalaburagi', lat: 17.33, lng: 76.83, zone: 'North Eastern Dry Zone' },
      { id: 'ka-tumakuru', name: 'Tumakuru', lat: 13.34, lng: 77.1, zone: 'Southern Dry Zone' },
      { id: 'ka-hassan', name: 'Hassan', lat: 13.0, lng: 76.1, zone: 'Southern Transition Zone' },
      { id: 'ka-dharwad', name: 'Dharwad', lat: 15.44, lng: 75.01, zone: 'Northern Transition Zone' },
      { id: 'ka-kolar', name: 'Kolar', lat: 13.14, lng: 78.16, zone: 'Eastern Dry Zone' },
      { id: 'ka-chitradurga', name: 'Chitradurga', lat: 14.23, lng: 76.42, zone: 'Central Dry Zone' },
      { id: 'ka-bidar', name: 'Bidar', lat: 17.91, lng: 77.53, zone: 'North Eastern Transition Zone' },
      { id: 'ka-shivamogga', name: 'Shivamogga', lat: 13.93, lng: 75.56, zone: 'Hilly Zone' },
      { id: 'ka-raichur', name: 'Raichur', lat: 16.21, lng: 77.38, zone: 'North Eastern Dry Zone' },
      { id: 'ka-mandya', name: 'Mandya', lat: 12.52, lng: 76.9, zone: 'Southern Dry Zone' },
      { id: 'ka-vijayapura', name: 'Vijayapura', lat: 16.83, lng: 75.71, zone: 'Northern Dry Zone' },
      { id: 'ka-dakshina-kannada', name: 'Dakshina Kannada', lat: 12.87, lng: 75.36, zone: 'Coastal Zone' },
      { id: 'ka-chikkamagaluru', name: 'Chikkamagaluru', lat: 13.32, lng: 75.78, zone: 'Hilly Zone' }
    ]
  },
  {
    id: 'mh',
    name: 'Maharashtra',
    zone: 'Deccan Plateau',
    districts: [
      { id: 'mh-pune', name: 'Pune', lat: 18.52, lng: 73.86, zone: 'Western Maharashtra' },
      { id: 'mh-nashik', name: 'Nashik', lat: 20.0, lng: 73.78, zone: 'Western Maharashtra' },
      { id: 'mh-nagpur', name: 'Nagpur', lat: 21.15, lng: 79.09, zone: 'Vidarbha' },
      { id: 'mh-aurangabad', name: 'Aurangabad', lat: 19.88, lng: 75.34, zone: 'Marathwada' }
    ]
  },
  {
    id: 'tn',
    name: 'Tamil Nadu',
    zone: 'Coromandel Coast',
    districts: [
      { id: 'tn-coimbatore', name: 'Coimbatore', lat: 11.02, lng: 76.96, zone: 'Western Zone' },
      { id: 'tn-thanjavur', name: 'Thanjavur', lat: 10.79, lng: 79.14, zone: 'Cauvery Delta' },
      { id: 'tn-madurai', name: 'Madurai', lat: 9.93, lng: 78.12, zone: 'Southern Zone' }
    ]
  },
  {
    id: 'tg',
    name: 'Telangana',
    zone: 'Deccan Plateau',
    districts: [
      { id: 'tg-warangal', name: 'Warangal', lat: 18.0, lng: 79.59, zone: 'Northern Telangana' },
      { id: 'tg-nalgonda', name: 'Nalgonda', lat: 17.05, lng: 79.27, zone: 'Southern Telangana' }
    ]
  },
  {
    id: 'ap',
    name: 'Andhra Pradesh',
    zone: 'Krishna–Godavari Basin',
    districts: [
      { id: 'ap-guntur', name: 'Guntur', lat: 16.31, lng: 80.43, zone: 'Coastal Andhra' },
      { id: 'ap-kurnool', name: 'Kurnool', lat: 15.83, lng: 78.04, zone: 'Rayalaseema' }
    ]
  },
  {
    id: 'kl',
    name: 'Kerala',
    zone: 'Malabar Coast',
    districts: [
      { id: 'kl-wayanad', name: 'Wayanad', lat: 11.69, lng: 76.13, zone: 'High Ranges' },
      { id: 'kl-palakkad', name: 'Palakkad', lat: 10.79, lng: 76.65, zone: 'Palakkad Plain' }
    ]
  },
  {
    id: 'gj',
    name: 'Gujarat',
    zone: 'Western Dry Region',
    districts: [
      { id: 'gj-rajkot', name: 'Rajkot', lat: 22.3, lng: 70.8, zone: 'Saurashtra' },
      { id: 'gj-ahmedabad', name: 'Ahmedabad', lat: 23.02, lng: 72.57, zone: 'Central Gujarat' }
    ]
  },
  {
    id: 'rj',
    name: 'Rajasthan',
    zone: 'Arid Zone',
    districts: [
      { id: 'rj-jaipur', name: 'Jaipur', lat: 26.91, lng: 75.79, zone: 'Eastern Rajasthan' },
      { id: 'rj-jodhpur', name: 'Jodhpur', lat: 26.24, lng: 73.02, zone: 'Arid West Rajasthan' }
    ]
  },
  {
    id: 'up',
    name: 'Uttar Pradesh',
    zone: 'Gangetic Plain',
    districts: [
      { id: 'up-lucknow', name: 'Lucknow', lat: 26.85, lng: 80.95, zone: 'Central Gangetic' },
      { id: 'up-varanasi', name: 'Varanasi', lat: 25.32, lng: 82.99, zone: 'Eastern Gangetic' }
    ]
  },
  {
    id: 'pb',
    name: 'Punjab',
    zone: 'Northern Alluvium',
    districts: [
      { id: 'pb-ludhiana', name: 'Ludhiana', lat: 30.9, lng: 75.86, zone: 'Central Punjab' },
      { id: 'pb-bathinda', name: 'Bathinda', lat: 30.21, lng: 74.94, zone: 'Southwestern Punjab' }
    ]
  },
  {
    id: 'mp',
    name: 'Madhya Pradesh',
    zone: 'Malwa Plateau',
    districts: [
      { id: 'mp-indore', name: 'Indore', lat: 22.72, lng: 75.86, zone: 'Malwa Plateau' },
      { id: 'mp-jabalpur', name: 'Jabalpur', lat: 23.18, lng: 79.99, zone: 'Central Narmada Valley' }
    ]
  },
  {
    id: 'wb',
    name: 'West Bengal',
    zone: 'Lower Gangetic Delta',
    districts: [
      { id: 'wb-birbhum', name: 'Birbhum', lat: 23.77, lng: 87.55, zone: 'Rarh Plain' },
      { id: 'wb-hooghly', name: 'Hooghly', lat: 22.9, lng: 88.39, zone: 'New Alluvial Zone' }
    ]
  }
];

export function listRegions() {
  return STATES.map((s) => ({
    id: s.id,
    name: s.name,
    zone: s.zone,
    districtCount: s.districts.length,
    districts: s.districts.map((d) => d.id)
  }));
}

export function findRegion(regionId) {
  return STATES.find((s) => s.id === regionId) || null;
}

export function listDistricts(regionId) {
  const state = findRegion(regionId);
  return state ? state.districts : [];
}

export function findDistrict(regionId, districtId) {
  const state = findRegion(regionId);
  if (!state) return null;
  if (!districtId) return state.districts[0] || null;
  return state.districts.find((d) => d.id === districtId) || state.districts[0] || null;
}

export function defaultDistrict(regionId) {
  const state = findRegion(regionId);
  return state ? state.districts[0] : null;
}

export const ZONE_DESCRIPTIONS = {
  'Eastern Dry Zone': 'Red gravelly soils, 330–700 mm rain, drought-prone; suits ragi, groundnut, mango.',
  'Southern Dry Zone': 'Medium black to red soils, suits ragi, jowar, sugarcane under canal and borewell.',
  'Northern Transition Zone': 'Medium black soils, suits jowar, cotton, sugarcane, tobacco.',
  'North Eastern Dry Zone': 'Shallow black soils, 550–700 mm rain; suits jowar, pigeonpea, sunflower.',
  'Central Dry Zone': 'Shallow red soils with frequent mid-season drought; suits jowar, ragi, horsegram.',
  'Hilly Zone': 'High rainfall forest soils, suits coffee, pepper, ginger, paddy.',
  'Coastal Zone': 'Laterite and coastal alluvium, suits paddy, arecanut, coconut, cashew.',
  'Northern Dry Zone': 'Deep black soils, 400–500 mm rain; suits jowar, bajra, grape, pomegranate.',
  'Southern Transition Zone': 'Mixed red and black soils; suits sugarcane, paddy, coconut, coffee.'
};

export function zoneSummary(district) {
  if (!district) return null;
  return {
    zone: district.zone,
    description: ZONE_DESCRIPTIONS[district.zone] ||
      'Mixed agro-climatic zone; verify local soil test and rainfall pattern with the district agriculture office.'
  };
}
