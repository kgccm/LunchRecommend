export default defineEventHandler(async (event) => {
  const { lat, lon } = getQuery(event)

  if (!lat || !lon) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Latitude and Longitude are required',
    })
  }

  // Overpass QL Query
  // Search for restaurants, fast_food, and cafes within 500m radius
  const radius = 500
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|fast_food|cafe"](around:${radius},${lat},${lon});
      way["amenity"~"restaurant|fast_food|cafe"](around:${radius},${lat},${lon});
    );
    out center 20;
  `

  try {
    const response: any = await $fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    // Transform OSM data to our app's format
    const items = response.elements.map((element: any) => {
      const tags = element.tags || {}
      const coordinate = element.type === 'node' 
        ? { lat: element.lat, lon: element.lon }
        : { lat: element.center.lat, lon: element.center.lon } // for ways

      // Fallback for missing names
      const title = tags.name || tags['name:ko'] || tags['name:en'] || 'Unknown Place'
      const category = tags.cuisine ? tags.cuisine.charAt(0).toUpperCase() + tags.cuisine.slice(1) : (tags.amenity || 'Restaurant')

      return {
        title: title,
        category: category,
        roadAddress: `Distance: ~${Math.round(calculateDistance(Number(lat), Number(lon), coordinate.lat, coordinate.lon))}m`,
        lat: coordinate.lat,
        lon: coordinate.lon
      }
    }).filter((item: any) => item.title !== 'Unknown Place') // Filter out nameless places

    return { items }

  } catch (error) {
    console.error('Overpass API Error:', error)
    return { items: [] } // Return empty on error to avoid breaking UI
  }
})

// Simple Haversine formula for distance estimation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}