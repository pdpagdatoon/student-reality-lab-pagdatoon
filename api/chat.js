import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { buildComparisonChartPayload, buildHotelComparisonChart } from './chartTools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const destinationsData = JSON.parse(
  readFileSync(join(__dirname, '../data/processed.json'), 'utf-8').replace(/^\uFEFF/, '')
);

const DESTINATION_HOTELS = {
  'Atlantic City': [
    { name: 'Resorts Casino Hotel', priceRange: '$89–$149', tag: 'Casino Resort', platform: 'Official Site', url: 'https://www.resortscasino.com/hotel/' },
    { name: 'Hard Rock Hotel & Casino Atlantic City', priceRange: '$95–$175', tag: 'Entertainment', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Hard Rock Hotel Atlantic City New Jersey')}` },
    { name: 'La Quinta Atlantic City', priceRange: '$65–$99', tag: 'Budget Pick', platform: 'Wyndham', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('La Quinta Atlantic City New Jersey')}` },
  ],
  'Cape May': [
    { name: 'Congress Hall Cape May', priceRange: '$129–$299', tag: 'Historic Hotel', platform: 'Official Site', url: 'https://www.caperesorts.com/congress-hall' },
    { name: 'Inn of Cape May', priceRange: '$95–$180', tag: 'Boutique Inn', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Inn of Cape May New Jersey')}` },
    { name: 'Holiday Inn Cape May', priceRange: '$79–$140', tag: 'Family-Friendly', platform: 'IHG', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Holiday Inn Cape May New Jersey')}` },
  ],
  'Wildwood': [
    { name: 'Starlux Hotel Wildwood', priceRange: '$85–$140', tag: 'Doo Wop Style', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Starlux Hotel Wildwood New Jersey')}` },
    { name: 'Condor Motel Wildwood', priceRange: '$55–$90', tag: 'Budget Pick', platform: 'Booking.com', url: 'https://www.booking.com/hotel/us/condor-motel.html' },
    { name: 'Port Royal Hotel Wildwood', priceRange: '$75–$125', tag: 'Boardwalk Access', platform: 'Expedia', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Port Royal Hotel Wildwood New Jersey')}` },
  ],
  'Seaside Heights': [
    { name: 'The Windjammer Motor Inn', priceRange: '$70–$115', tag: 'Beachfront', platform: 'Booking.com', url: 'https://www.booking.com/hotel/us/windjammer-motor-inn.html' },
    { name: 'Hershey Motel', priceRange: '$75–$130', tag: 'Boardwalk Area', platform: 'Official Site', url: 'https://hersheymotel.com/' },
    { name: 'Aire Hotel North Beach', priceRange: '$85–$145', tag: 'Oceanfront', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Aire Hotel North Beach New Jersey')}` },
  ],
  'Asbury Park': [
    { name: 'The Asbury Hotel', priceRange: '$119–$249', tag: 'Boutique', platform: 'Official Site', url: 'https://www.theasburyhotel.com/rooms-and-suites' },
    { name: 'The Berkeley Oceanfront Hotel', priceRange: '$95–$175', tag: 'Historic', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('The Berkeley Oceanfront Hotel Asbury Park New Jersey')}` },
    { name: 'Empress Hotel Asbury Park', priceRange: '$85–$150', tag: 'Oceanfront', platform: 'Booking.com', url: 'https://www.booking.com/hotel/us/the-empress-hotel.html' },
  ],
  'Long Beach Island': [
    { name: 'Engleside Inn Beach Haven', priceRange: '$110–$185', tag: 'Waterfront', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Engleside Inn Beach Haven New Jersey')}` },
    { name: 'Sand Castle Motel LBI', priceRange: '$70–$120', tag: 'Budget Pick', platform: 'Booking.com', url: 'https://www.booking.com/hotel/us/sand-castle-motel.html' },
    { name: 'Spray Beach Hotel LBI', priceRange: '$85–$145', tag: 'Beachfront', platform: 'Expedia', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Spray Beach Hotel Long Beach Island New Jersey')}` },
  ],
  'Ocean City NJ': [
    { name: 'Flanders Hotel Ocean City', priceRange: '$90–$165', tag: 'Historic Hotel', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Flanders Hotel Ocean City New Jersey')}` },
    { name: 'Port-O-Call Hotel Ocean City', priceRange: '$80–$135', tag: 'Boardwalk Side', platform: 'Official Site', url: 'https://www.portocallhotel.com/rooms/' },
    { name: 'Impala Island Inn Ocean City', priceRange: '$65–$100', tag: 'Budget Pick', platform: 'Booking.com', url: 'https://www.booking.com/hotel/us/impala-island-inn.html' },
  ],
  'Sandy Hook': [
    { name: 'Camp Gateway Sandy Hook', priceRange: '$30', tag: 'Official Campground', platform: 'Recreation.gov', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Camp Gateway Sandy Hook New Jersey')}` },
    { name: 'Molly Pitcher Inn Red Bank', priceRange: '$95–$185', tag: 'Closest Hotel', platform: 'Official Site', url: 'https://www.mollypitcherinn.com/rooms/' },
    { name: 'Courtyard Middletown Hazlet', priceRange: '$79–$130', tag: 'Budget Choice', platform: 'Marriott', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Courtyard Middletown Hazlet New Jersey')}` },
    { name: 'Hampton Inn Tinton Falls', priceRange: '$85–$140', tag: 'Reliable Chain', platform: 'Hilton', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Hampton Inn Tinton Falls New Jersey')}` },
  ],
  'Princeton': [
    { name: 'Nassau Inn Princeton', priceRange: '$129–$220', tag: 'Historic Hotel', platform: 'Official Site', url: 'https://nassauinn.com/rooms/' },
    { name: 'Hyatt Regency Princeton', priceRange: '$99–$189', tag: 'Full Service', platform: 'Hyatt', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Hyatt Regency Princeton New Jersey')}` },
    { name: 'Residence Inn Princeton', priceRange: '$89–$155', tag: 'Extended Stay', platform: 'Marriott', url: 'https://www.marriott.com/en-us/hotels/ttnri-residence-inn-princeton-at-carnegie-center/overview/' },
  ],
  'Delaware Water Gap': [
    { name: 'Shawnee Inn and Golf Resort', priceRange: '$89–$170', tag: 'Resort', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Shawnee Inn and Golf Resort New Jersey')}` },
    { name: 'The Inn at Millrace Pond', priceRange: '$95–$165', tag: 'Historic Inn', platform: 'Official Site', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('The Inn at Millrace Pond New Jersey')}` },
    { name: 'Hampton Inn East Stroudsburg', priceRange: '$70–$120', tag: 'Budget Pick', platform: 'Hilton', url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent('Hampton Inn East Stroudsburg New Jersey')}` },
  ],
};

// Ensure every hotel entry has a backupUrl field to fall back to Booking search
Object.entries(DESTINATION_HOTELS).forEach(([dest, hotels]) => {
  (hotels || []).forEach(h => {
    if (!h.backupUrl) {
      try {
        h.backupUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent((h.name || '') + ' ' + dest + ' NJ')}`;
      } catch (e) {
        h.backupUrl = `https://www.booking.com/`;
      }
    }
  });
});

const LIVE_HOTEL_CACHE = new Map();
const LIVE_HOTEL_CACHE_TTL_MS = 1000 * 60 * 30;
const LIVE_SEARCH_RADIUS_METERS = 12000;

const DESTINATION_CARD_PHOTOS = {
  'Atlantic City':        'images/destinations/atlantic-city.jpg',
  'Cape May':             'images/destinations/cape-may.jpg',
  'Wildwood':             'images/destinations/wildwood.jpg',
  'Seaside Heights':      'images/destinations/seaside-heights.jpg',
  'Asbury Park':          'images/destinations/asbury-park.jpg',
  'Long Beach Island':    'images/destinations/long-beach-island.jpg',
  'Ocean City NJ':        'images/destinations/ocean-city.jpg',
  'Sandy Hook':           'images/destinations/sandy-hook.jpg',
  'Princeton':            'images/destinations/princeton.jpg',
  'Delaware Water Gap':   'images/destinations/delaware-water-gap.jpg',
};

const DESTINATION_MAP_META = {
  'Atlantic City': { lat: 39.3643, lng: -74.4229 },
  'Cape May': { lat: 38.9351, lng: -74.9060 },
  'Wildwood': { lat: 38.9918, lng: -74.8149 },
  'Seaside Heights': { lat: 39.9448, lng: -74.0729 },
  'Asbury Park': { lat: 40.2204, lng: -74.0121 },
  'Long Beach Island': { lat: 39.6482, lng: -74.1733 },
  'Ocean City NJ': { lat: 39.2776, lng: -74.5746 },
  'Sandy Hook': { lat: 40.4665, lng: -74.0002 },
  'Princeton': { lat: 40.3573, lng: -74.6672 },
  'Delaware Water Gap': { lat: 40.9793, lng: -75.1429 },
};

const MAP_KEYWORDS = /(map|where|location|directions|near|distance|route)/i;

const DESTINATION_ALLOWED_CITY_TERMS = {
  'Atlantic City': ['atlantic city'],
  'Cape May': ['cape may'],
  'Wildwood': ['wildwood'],
  'Seaside Heights': ['seaside heights', 'seaside park'],
  'Asbury Park': ['asbury park', 'ocean grove', 'neptune'],
  'Long Beach Island': ['beach haven', 'ship bottom', 'surf city', 'harvey cedars', 'long beach island'],
  'Ocean City NJ': ['ocean city'],
  'Sandy Hook': ['sandy hook', 'highlands', 'red bank', 'hazlet', 'tinton falls'],
  'Princeton': ['princeton'],
  'Delaware Water Gap': ['delaware water gap', 'east stroudsburg', 'shawnee on delaware'],
};

const DESTINATION_HOTEL_DENYLIST = {
  'Seaside Heights': [
    'the breakers ocean resort',
    'the breakers on the ocean',
    'comfort inn toms river',
  ],
};

const requestBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 40;

const defaultSources = [
  { label: 'Dataset methodology', url: 'https://github.com/pdpagdatoon/student-reality-lab-pagdatoon/blob/main/data/notes.md' },
  { label: 'Booking baseline', url: 'https://www.booking.com/' },
  { label: 'Booking (alternate)', url: 'https://www.booking.com/' },
  { label: 'OpenStreetMap live hotels', url: 'https://www.openstreetmap.org/' },
  { label: 'NJ Transit fares', url: 'https://www.njtransit.com/' },
];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_all_destinations',
      description: 'Returns a list of all New Jersey Spring Break destinations with cost data, distances, and what each place is known for.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_destinations_by_budget',
      description: 'Filters NJ destinations that fit within a student budget given trip length and how many people share the lodging cost.',
      parameters: {
        type: 'object',
        properties: {
          budget: { type: 'number', description: 'Total trip budget in USD' },
          trip_length_days: { type: 'number', description: 'Number of days for the trip' },
          people_sharing_lodging: { type: 'number', description: 'Number of people splitting lodging cost' },
        },
        required: ['budget', 'trip_length_days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_destination_details',
      description: 'Returns full details for a specific NJ destination including attractions, activities, food costs, and lodging costs.',
      parameters: {
        type: 'object',
        properties: {
          destination_name: { type: 'string', description: 'Name of destination' },
        },
        required: ['destination_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_hotels_near_destination',
      description: 'Suggests hotels near a specific NJ destination for students on a budget.',
      parameters: {
        type: 'object',
        properties: {
          destination_name: { type: 'string', description: 'Name of destination' },
          budget_per_night: { type: 'number', description: 'Max budget per night' },
        },
        required: ['destination_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_attractions_by_interest',
      description: 'Finds NJ Spring Break destinations with attractions matching a student interest.',
      parameters: {
        type: 'object',
        properties: {
          interest: { type: 'string', description: 'Type of interest' },
        },
        required: ['interest'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_comparison_chart',
      description: 'Generates a small chart payload to compare numeric values for destinations or hotels (bar, pie, or budget_gauge).',
      parameters: {
        type: 'object',
        properties: {
          chart_type: { type: 'string', enum: ['bar', 'pie', 'budget_gauge'] },
          title: { type: 'string' },
          items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'number' } }, required: ['label','value'] } },
          unit: { type: 'string' },
          budget: { type: 'number' }
        },
        required: ['chart_type','title','items']
      }
    }
  },
];

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const earthRadius = 6371000;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function getEstimatedPriceRange(destinationName) {
  const destination = destinationsData.find(d => d.destination === destinationName);
  const nightly = destination?.lodging_per_night || 120;
  const low = Math.max(35, Math.round(nightly * 0.7));
  const high = Math.max(low + 20, Math.round(nightly * 1.25));
  return `$${low}-$${high}`;
}

function isLikelyClosed(tags = {}) {
  const closedFlags = ['disused', 'abandoned', 'demolished', 'construction', 'closed'];
  const text = Object.entries(tags)
    .map(([k, v]) => `${k}:${String(v || '')}`.toLowerCase())
    .join(' ');

  return closedFlags.some(flag => text.includes(flag));
}

function isDeniedHotel(destinationName, hotelName) {
  const denied = DESTINATION_HOTEL_DENYLIST[destinationName] || [];
  const normalizedName = String(hotelName || '').toLowerCase();
  return denied.some(entry => normalizedName.includes(entry));
}

function buildStaticBookingCards(destinationName) {
  const hotels = DESTINATION_HOTELS[destinationName];
  if (!hotels) return [];
  const photo = DESTINATION_CARD_PHOTOS[destinationName] || 'images/destinations/default.jpg';
  const allowedTerms = DESTINATION_ALLOWED_CITY_TERMS[destinationName] || [destinationName.toLowerCase()];

  return hotels
    .filter(h => h.status !== 'closed' && h.status !== 'permanently_closed')
    .filter(h => !isDeniedHotel(destinationName, h.name))
    .filter(h => {
      const locationHint = `${h.city || destinationName} ${h.name || ''} ${h.url || ''}`.toLowerCase();
      return allowedTerms.some(term => locationHint.includes(term));
    })
    .map(h => ({
    query: encodeURIComponent(`${h.name} ${destinationName} New Jersey`),
    name: h.name,
    location: destinationName,
    priceRange: h.priceRange + '/night',
    tag: h.tag,
    imageUrl: photo,
    platform: h.platform,
    bookingUrl: h.url,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${destinationName} New Jersey`)}`,
    backupUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${h.name} ${destinationName} New Jersey`)}`,
  }))
    .map(({ query, ...rest }) => rest);
}

async function fetchLiveHotels(destinationName) {
  const destinationMeta = DESTINATION_MAP_META[destinationName];
  if (!destinationMeta) return [];

  const cacheKey = destinationName;
  const cached = LIVE_HOTEL_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < LIVE_HOTEL_CACHE_TTL_MS) {
    return cached.hotels;
  }

  const overpassQuery = `[out:json][timeout:20];(node["tourism"~"hotel|motel|guest_house|hostel"](around:${LIVE_SEARCH_RADIUS_METERS},${destinationMeta.lat},${destinationMeta.lng});way["tourism"~"hotel|motel|guest_house|hostel"](around:${LIVE_SEARCH_RADIUS_METERS},${destinationMeta.lat},${destinationMeta.lng});relation["tourism"~"hotel|motel|guest_house|hostel"](around:${LIVE_SEARCH_RADIUS_METERS},${destinationMeta.lat},${destinationMeta.lng}););out center tags 80;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(overpassQuery)}`,
  });

  if (!response.ok) return [];

  const payload = await response.json();
  const elements = Array.isArray(payload?.elements) ? payload.elements : [];
  const allowedTerms = DESTINATION_ALLOWED_CITY_TERMS[destinationName] || [destinationName.toLowerCase()];
  const photo = DESTINATION_CARD_PHOTOS[destinationName] || 'images/destinations/default.jpg';
  const estimatedPrice = getEstimatedPriceRange(destinationName);

  const hotels = elements
    .map((el) => {
      const tags = el.tags || {};
      const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
      const lng = typeof el.lon === 'number' ? el.lon : el.center?.lon;
      if (!tags.name || typeof lat !== 'number' || typeof lng !== 'number') return null;
      if (isLikelyClosed(tags)) return null;
      if (isDeniedHotel(destinationName, tags.name)) return null;

      const city = String(tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '').toLowerCase();
      const locationHint = `${city} ${tags.name} ${tags.website || tags.url || ''}`.toLowerCase();
      const withinTerms = allowedTerms.some(term => locationHint.includes(term));
      const metersAway = distanceMeters(destinationMeta.lat, destinationMeta.lng, lat, lng);

      const requireCityMatch = ['Seaside Heights', 'Ocean City NJ', 'Cape May', 'Wildwood', 'Atlantic City', 'Princeton']
        .includes(destinationName);

      if (requireCityMatch && !withinTerms) return null;
      if (!requireCityMatch && !withinTerms && metersAway > 9000) return null;

      const siteUrl = tags.website || tags.url || `https://www.openstreetmap.org/${el.type}/${el.id}`;
      return {
        name: tags.name,
        location: destinationName,
        priceRange: `${estimatedPrice}/night`,
        tag: 'Live Nearby',
        imageUrl: photo,
        platform: 'OpenStreetMap',
        bookingUrl: siteUrl,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tags.name} ${destinationName} New Jersey`)}`,
        backupUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${tags.name} ${destinationName} New Jersey`)}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 4);

  LIVE_HOTEL_CACHE.set(cacheKey, { savedAt: Date.now(), hotels });
  return hotels;
}

async function buildBookingCards(destinationName) {
  try {
    const live = await fetchLiveHotels(destinationName);
    if (live.length > 0) return live;
  } catch {
    // Fall back to curated list when live lookup fails.
  }
  return buildStaticBookingCards(destinationName);
}

function isStreamRequest(req) {
  if (req.query && req.query.stream === '1') return true;
  try {
    const url = new URL(req.url || '', 'http://localhost');
    return url.searchParams.get('stream') === '1';
  } catch {
    return false;
  }
}

function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function toTextChunks(text) {
  return String(text || '').split(/(\s+)/).filter(Boolean);
}

function getAssistantErrorDetails(err) {
  const status = Number(err?.status || err?.statusCode || 500);
  const safeStatus = status >= 400 && status <= 599 ? status : 500;
  const code = String(err?.code || err?.error?.code || '').toLowerCase();
  const type = String(err?.type || err?.error?.type || '').toLowerCase();
  const rawMessage = String(err?.message || 'Unknown OpenAI error');

  let userMessage = 'Failed to get a response from the assistant.';

  if (safeStatus === 401 || code.includes('invalid_api_key') || /api key/i.test(rawMessage)) {
    userMessage = 'OpenAI authentication failed. Verify OPENAI_API_KEY in Vercel and redeploy.';
  } else if (safeStatus === 429 || code.includes('insufficient_quota') || /quota/i.test(rawMessage)) {
    userMessage = 'OpenAI quota or rate limit was reached. Check billing/usage limits for your API key.';
  } else if ((safeStatus === 400 || safeStatus === 404) && /model/i.test(rawMessage)) {
    userMessage = 'Configured OpenAI model is unavailable for this API key. Verify model access and name.';
  }

  const logMessage = `status=${safeStatus} code=${code || 'n/a'} type=${type || 'n/a'} message=${rawMessage}`;
  return { statusCode: safeStatus, userMessage, logMessage };
}

function extractDestinationMentions(messages) {
  const text = messages
    .map(m => String(m?.content || ''))
    .join(' ')
    .toLowerCase();

  return destinationsData
    .map(d => d.destination)
    .filter(name => text.includes(name.toLowerCase()));
}

function buildMapCards(destinations) {
  return destinations
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .map(name => {
      const meta = DESTINATION_MAP_META[name];
      if (!meta) return null;
      return {
        destination: name,
        coordinates: `${meta.lat.toFixed(4)}, ${meta.lng.toFixed(4)}`,
        mapUrl: `https://www.google.com/maps?q=${meta.lat},${meta.lng}`,
      };
    })
    .filter(Boolean);
}

function executeTool(name, args) {
  switch (name) {
    case 'get_all_destinations':
      return destinationsData.map(d => ({
        destination: d.destination,
        distance_miles: d.distance_miles,
        travel_cost: d.travel_cost,
        lodging_per_night: d.lodging_per_night,
        avg_food_per_day: d.avg_food_per_day,
        activity_cost: d.activity_cost,
        known_for: d.known_for,
      }));

    case 'find_destinations_by_budget': {
      const { budget, trip_length_days = 3, people_sharing_lodging = 1 } = args;
      return destinationsData
        .map(d => {
          const lodging = (d.lodging_per_night / people_sharing_lodging) * trip_length_days;
          const food = d.avg_food_per_day * trip_length_days;
          const total = d.travel_cost + lodging + food + d.activity_cost;
          return {
            destination: d.destination,
            known_for: d.known_for,
            total_trip_cost: Math.round(total),
            affordable: total <= budget,
            cost_breakdown: {
              travel: d.travel_cost,
              lodging_total: Math.round(lodging),
              food_total: Math.round(food),
              activities: d.activity_cost,
            },
          };
        })
        .sort((a, b) => a.total_trip_cost - b.total_trip_cost);
    }

    case 'get_destination_details': {
      const dest = destinationsData.find(
        d => d.destination.toLowerCase() === args.destination_name.toLowerCase()
      );
      if (!dest) return { error: `Destination "${args.destination_name}" not found.` };
      return dest;
    }

    case 'find_hotels_near_destination': {
      const dest = destinationsData.find(
        d => d.destination.toLowerCase() === args.destination_name.toLowerCase()
      );
      if (!dest) return { error: `Destination "${args.destination_name}" not found.` };
      const budgetNote = args.budget_per_night
        ? ` The student's max budget per night is $${args.budget_per_night}.`
        : '';
      return {
        destination: dest.destination,
        average_lodging_per_night: dest.lodging_per_night,
        context: `${dest.about}${budgetNote}`,
        tip: 'Prices are for the Spring Break period. Booking early or splitting with friends reduces per-person cost significantly.',
        share_savings: {
          solo: dest.lodging_per_night,
          split_2: Math.round(dest.lodging_per_night / 2),
          split_3: Math.round(dest.lodging_per_night / 3),
          split_4: Math.round(dest.lodging_per_night / 4),
        },
      };
    }

    case 'get_attractions_by_interest': {
      const interest = String(args.interest || '').toLowerCase();
      const keywords = {
        beach: ['beach', 'shore', 'boardwalk', 'sand', 'surf', 'ocean'],
        nightlife: ['casino', 'bar', 'club', 'entertainment', 'music', 'rooftop'],
        history: ['historic', 'lighthouse', 'museum', 'victorian', 'fort', 'oldest', 'national'],
        outdoor: ['hike', 'trail', 'kayak', 'park', 'nature', 'bird', 'waterfall', 'appalachian'],
        music: ['music', 'concert', 'pony', 'indie', 'stage', 'theatre'],
        food: ['seafood', 'dining', 'restaurant', 'taffy', 'sub', 'coffee'],
        family: ['family', 'amusement', 'ride', 'wonderland', 'pier', 'aquarium'],
      };
      const matchKey = Object.keys(keywords).find(k => interest.includes(k)) || 'beach';
      const terms = keywords[matchKey] || keywords.beach;
      const matches = destinationsData
        .filter(d => {
          const text = `${d.known_for} ${d.about} ${d.attractions?.join(' ')}`.toLowerCase();
          return terms.some(t => text.includes(t));
        })
        .map(d => ({
          destination: d.destination,
          known_for: d.known_for,
          relevant_attractions: d.attractions?.filter(a => terms.some(t => a.toLowerCase().includes(t))),
          travel_cost: d.travel_cost,
          lodging_per_night: d.lodging_per_night,
        }));
      return { interest: args.interest, matches };
    }

    case 'generate_comparison_chart': {
      return buildComparisonChartPayload(args);
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = requestBuckets.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    requestBuckets.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT;
}

const systemPrompt = {
  role: 'system',
  content: `You are SpringBreakBot 🌊, a friendly student travel advisor specializing in New Jersey Spring Break destinations.
Your goal is to help students find the best destinations, attractions, and hotels that fit their preferences and budget.

You have access to real data for 10 NJ destinations: Atlantic City, Cape May, Wildwood, Seaside Heights, Asbury Park, Long Beach Island, Ocean City NJ, Sandy Hook, Princeton, and Delaware Water Gap.

Guidelines:
- Always use the available tools to get accurate cost and destination data before making recommendations
- Be upbeat, concise, and budget-conscious — students care about value
- When a student asks about hotels or lodging, ALWAYS call find_hotels_near_destination — Booking.com hotel cards with images and links will be shown automatically below your reply, so keep your hotel text brief (just name the destination and price range)
- Mention specific attractions from the data tool results
- Use markdown formatting: **bold** for key facts, ### for section headers, bullet lists for options
- If the student's budget is tight, proactively suggest splitting lodging costs with friends
- Keep responses focused and avoid lengthy prose`,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: 'Too many requests. Please wait and try again.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { messages } = body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  const boundedMessages = messages.slice(-20);

  const malformed = boundedMessages.some(
    m => !m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || m.content.length > 1200
  );
  if (malformed) {
    return res.status(400).json({ error: 'messages contains invalid items' });
  }

  const conversationMessages = [systemPrompt, ...boundedMessages];
  const hotelSearches = [];
  const mentionedDestinations = extractDestinationMentions(boundedMessages);
  const latestUserText = [...boundedMessages].reverse().find(m => m.role === 'user')?.content || '';
  const wantsMapCards = MAP_KEYWORDS.test(latestUserText);
  const streamMode = isStreamRequest(req);
  let chartPayload = null;

  try {
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: conversationMessages,
      tools,
      tool_choice: 'auto',
    });

    while (response.choices[0].finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message;
      conversationMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls || []) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        if (toolCall.function.name === 'find_hotels_near_destination' && args.destination_name) {
          hotelSearches.push(args.destination_name);
        }
        const result = executeTool(toolCall.function.name, args);
        if (toolCall.function.name === 'generate_comparison_chart' && result && typeof result === 'object' && result.type && result.data) {
          chartPayload = result;
        }
        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools,
        tool_choice: 'auto',
      });
    }

    const finalMessage = response.choices[0].message.content;
    const uniqueHotelDests = [...new Set(hotelSearches)];
    const bookingLists = await Promise.all(uniqueHotelDests.map(dest => buildBookingCards(dest)));
    const bookingCards = bookingLists.flat();
    const mapCandidates = [...hotelSearches, ...mentionedDestinations].slice(0, 6);
    const mapCards = (wantsMapCards || mapCandidates.length > 0)
      ? buildMapCards(mapCandidates).slice(0, 4)
      : [];
    if (!chartPayload && bookingCards.length > 0) {
      chartPayload = buildHotelComparisonChart(bookingCards, { chart_type: 'bar' });
    }
    const quickReplies = hotelSearches.length > 0
      ? [
          'Compare those options by total 3-day budget',
          'Show me a cheaper alternative destination',
          'What attractions are near these hotels?',
        ]
      : [
          'Find me the best nightlife destination',
          'Which destination is cheapest for 3 days?',
          'Recommend hotels under $120/night',
          'Show map links for Cape May and Wildwood',
        ];

    const payload = {
      reply: finalMessage,
      sources: defaultSources,
      quickReplies,
      ...(chartPayload && { inlineChart: chartPayload }),
      ...(bookingCards.length > 0 && { bookingCards }),
      ...(mapCards.length > 0 && { mapCards }),
    };

    if (!streamMode) {
      return res.status(200).json(payload);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Stream tokens with small delays to simulate real-time text generation
    const chunks = toTextChunks(payload.reply);
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      sseWrite(res, 'token', { token: chunks[i] });
    }

    sseWrite(res, 'meta', {
      ...(payload.bookingCards ? { bookingCards: payload.bookingCards } : {}),
      ...(payload.mapCards ? { mapCards: payload.mapCards } : {}),
      ...(payload.inlineChart ? { inlineChart: payload.inlineChart } : {}),
      sources: payload.sources,
      quickReplies: payload.quickReplies,
    });
    // Optionally emit a lightweight chart payload comparing hotel nightly midpoints
    try {
      if (payload.inlineChart) {
        sseWrite(res, 'chart', payload.inlineChart);
      }
    } catch (e) {
      // don't fail the whole stream if chart generation errors
      console.warn('Chart generation failed', e?.message || e);
    }
    sseWrite(res, 'done', { ok: true });
    res.end();
    return;
  } catch (err) {
    const errorDetails = getAssistantErrorDetails(err);
    console.error('OpenAI error:', errorDetails.logMessage);
    if (streamMode) {
      res.setHeader('Content-Type', 'text/event-stream');
      sseWrite(res, 'error', { error: errorDetails.userMessage });
      sseWrite(res, 'done', { ok: false });
      res.end();
      return;
    }
    return res.status(errorDetails.statusCode).json({ error: errorDetails.userMessage });
  }
}
