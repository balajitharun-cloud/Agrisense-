export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestDistrict(districts, lat, lng) {
  let best = null;
  let bestKm = Infinity;
  for (const d of districts) {
    if (typeof d.lat !== 'number' || typeof d.lng !== 'number') continue;
    const km = haversineKm(lat, lng, d.lat, d.lng);
    if (km < bestKm) {
      bestKm = km;
      best = d;
    }
  }
  return best ? { ...best, distanceKm: Math.round(bestKm) } : null;
}

export async function fetchAllDistricts(apiGet) {
  const regions = await apiGet('/regions');
  const ids = (regions && regions.regions ? regions.regions : []).map((r) => r.id);
  const perRegion = await Promise.all(
    ids.map((id) => apiGet(`/regions/${id}/districts`).catch(() => ({ districts: [] })))
  );
  const out = [];
  for (let i = 0; i < ids.length; i += 1) {
    const list = perRegion[i] && perRegion[i].districts ? perRegion[i].districts : [];
    for (const d of list) out.push({ ...d, regionId: ids[i] });
  }
  return out;
}
