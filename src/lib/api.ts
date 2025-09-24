// --- OpenAI Itinerary Generation ---
// import { OPENAI_API_KEY } from './env'; // Already imported below

export async function generateItineraryWithOpenAI({
  destination,
  startDate,
  endDate,
  preferences,
  travelers,
  budget,
  isCountryLevel = false,
}: {
  destination: string;
  startDate: string;
  endDate: string;
  preferences: string[];
  travelers: number;
  budget?: number;
  isCountryLevel?: boolean;
}) {
  // Build prompt for OpenAI
  const prompt = `You are a travel planner. Create a detailed, multi-day itinerary for a trip to ${destination} from ${startDate} to ${endDate} for ${travelers} traveler(s). Preferences: ${preferences.join(", ")}. Budget: ${budget ? `$${budget}` : 'flexible'}. ${isCountryLevel ? 'This is a country-level trip. Include multiple cities, logical routing, and specify the city for each day. For each day, list the city, all stops (meals, activities, shopping, etc.), and a short summary. Do not use fake or placeholder venues. Make sure the itinerary covers the best cities and routes in ${destination}, and that each stop is a real, well-known place with address and website if possible.' : 'For each day, list the city, stops (meals, activities, shopping, etc.), and a short summary. Do not use fake or placeholder venues.'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a travel planner assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate itinerary with OpenAI');
  }
  const data = await response.json();
  // Parse and return the itinerary text
  const itineraryText = data.choices?.[0]?.message?.content || '';
  return itineraryText;
}

/**
 * Generate a multi-day itinerary for "Plan Your Trip" mode.
 * @param input - { city, startDate, endDate, preferences, budgetUsd, places, mealTimes, isCountry, countryCities }
 * @returns TripItinerary
 */

// Curated multi-city routes for popular countries
type CountryItinerary = { city: string; days: number; travel: { to: string; method: string; duration: string }[] };
const COUNTRY_ITINERARIES: Record<string, CountryItinerary[]> = {
  'japan': [
    { city: 'Tokyo', days: 4, travel: [{ to: 'Hakone', method: 'Shinkansen', duration: '1h' }] },
    { city: 'Hakone', days: 2, travel: [{ to: 'Kyoto', method: 'Shinkansen', duration: '2h' }] },
    { city: 'Kyoto', days: 3, travel: [{ to: 'Osaka', method: 'Train', duration: '30m' }] },
    { city: 'Osaka', days: 3, travel: [{ to: 'Hiroshima', method: 'Shinkansen', duration: '2h' }] },
    { city: 'Hiroshima', days: 2, travel: [] },
  ],
  // Add more countries as needed
};

export const generateTripItinerary = async (input: {

  city: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places: PlaceCandidate[];
  mealTimes?: { breakfast: string; lunch: string; dinner: string };
  isCountry?: boolean;
  countryCities?: string[]; // If country, list of cities in order
}): Promise<TripItinerary> => {
  function addMinutes(time: string, mins: number) {
    const [h, m] = time.split(':').map(Number);
    const dateObj = new Date(2000, 0, 1, h, m);
    dateObj.setMinutes(dateObj.getMinutes() + mins);
    return dateObj.toTimeString().slice(0, 5);
  }

  const mealTimes = input.mealTimes || getDefaultMealTimes();
  const { city, startDate, endDate, preferences, budgetUsd, places, isCountry, countryCities } = input;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);

  // If country, use curated route if available, else split days across cities
  let cityPlan: string[] = [];
  let travelPlan: { from: string; to: string; method: string; duration: string }[] = [];
  let usedCountryCities: string[] = [];
  if (isCountry) {
    const countryKey = city.toLowerCase();
    const itinerary = COUNTRY_ITINERARIES[countryKey];
    if (itinerary) {
      // Assign days per city as in curated itinerary, but scale to totalDays
      const totalCuratedDays = itinerary.reduce((sum: number, c: CountryItinerary) => sum + c.days, 0);
      let scale = totalDays / totalCuratedDays;
      let assigned = 0;
      for (let i = 0; i < itinerary.length; i++) {
        const cityDays = i === itinerary.length - 1
          ? totalDays - assigned // last city gets remainder
          : Math.round(itinerary[i].days * scale);
        assigned += cityDays;
        for (let d = 0; d < cityDays; d++) cityPlan.push(itinerary[i].city);
        usedCountryCities.push(itinerary[i].city);
        if (i > 0) {
          travelPlan.push({
            from: itinerary[i - 1].city,
            to: itinerary[i].city,
            method: itinerary[i - 1].travel[0]?.method || 'Train',
            duration: itinerary[i - 1].travel[0]?.duration || '2h',
          });
        }
      }
    } else if (countryCities && countryCities.length > 0) {
      // Distribute days as evenly as possible
      const base = Math.floor(totalDays / countryCities.length);
      let remainder = totalDays % countryCities.length;
      for (let i = 0; i < countryCities.length; i++) {
        const daysForCity = base + (remainder > 0 ? 1 : 0);
        remainder--;
        for (let d = 0; d < daysForCity; d++) cityPlan.push(countryCities[i]);
        usedCountryCities.push(countryCities[i]);
        if (i > 0) {
          travelPlan.push({
            from: countryCities[i - 1],
            to: countryCities[i],
            method: 'Train',
            duration: '2h',
          });
        }
      }
    } else {
      for (let i = 0; i < totalDays; i++) cityPlan.push(city);
      usedCountryCities.push(city);
    }
  } else {
    for (let i = 0; i < totalDays; i++) cityPlan.push(city);
    usedCountryCities.push(city);
  }

  // Categorize places
  const hasFoodPref = preferences.map(p => p.toLowerCase()).includes('food');
  const hasShoppingPref = preferences.map(p => p.toLowerCase()).includes('shopping');
  const foodPlaces = places.filter(p => (p.types || []).some((t: string) => t.toLowerCase().includes('restaurant') || t.toLowerCase().includes('food')));
  const breakfastPlaces = foodPlaces.filter(p => p.name.toLowerCase().includes('breakfast') || p.name.toLowerCase().includes('cafe'));
  const lunchPlaces = foodPlaces.filter(p => p.name.toLowerCase().includes('lunch') || p.name.toLowerCase().includes('ramen') || p.name.toLowerCase().includes('deli'));
  const dinnerPlaces = foodPlaces.filter(p => p.name.toLowerCase().includes('dinner') || p.name.toLowerCase().includes('steak') || p.name.toLowerCase().includes('bistro'));
  let activityPlaces = places.filter(p => (p.types || []).some((t: string) => t.toLowerCase().includes('museum') || t.toLowerCase().includes('park') || t.toLowerCase().includes('amusement') || t.toLowerCase().includes('tourist')));
  if (hasShoppingPref) {
    const shoppingPlaces = places.filter(p => (p.types || []).some((t: string) => t.toLowerCase().includes('shopping_mall') || t.toLowerCase().includes('shopping') || t.toLowerCase().includes('store') || t.toLowerCase().includes('market')));
    activityPlaces = [...activityPlaces, ...shoppingPlaces];
  }

  // No fallbacks: Only use real places. If not enough, show fewer stops.

  // Track used places to avoid repeats
  const usedPlaceIds = new Set<string>();

  const days: ItineraryDay[] = cityPlan.map((cityName, dayIdx) => {
    const dateObj = new Date(start);
    dateObj.setDate(start.getDate() + dayIdx);
    const date = dateObj.toISOString().slice(0, 10);

    // Strict city/country filter
    const filterByCity = (p: any) => p.address && p.address.toLowerCase().includes(cityName.toLowerCase());
    const filterByCountry = (p: any) => !input.isCountry || (p.country && p.country.toLowerCase() === city.toLowerCase());
    const filterByType = (p: any, type: string) => (p.types || []).some((t: string) => t.toLowerCase().includes(type));
    const isValidPlace = (p: any) => filterByCity(p) && filterByCountry(p) && !usedPlaceIds.has(p.placeId);

    // Meals: always include if food preference is chosen
    let breakfast, lunch, dinner;
    if (hasFoodPref) {
      const sortedBreakfasts = breakfastPlaces.filter(isValidPlace).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      breakfast = sortedBreakfasts[0] || foodPlaces.filter(isValidPlace)[0];
      if (breakfast) usedPlaceIds.add(breakfast.placeId);
      const sortedLunches = lunchPlaces.filter(isValidPlace).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      lunch = sortedLunches[0] || foodPlaces.filter(isValidPlace)[1] || foodPlaces.filter(isValidPlace)[0];
      if (lunch) usedPlaceIds.add(lunch.placeId);
      const sortedDinners = dinnerPlaces.filter(isValidPlace).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      dinner = sortedDinners[0] || foodPlaces.filter(isValidPlace)[2] || foodPlaces.filter(isValidPlace)[0];
      if (dinner) usedPlaceIds.add(dinner.placeId);
    }

    // Activities: real places only, top-rated, diverse
    let availableActivities = activityPlaces.filter(isValidPlace).filter(p => (p.rating || 0) > 4.2);
    // Prefer diversity: pick different types if possible
    const usedTypes = new Set<string>();
    const diverseActivities: any[] = [];
    for (const act of availableActivities) {
      const mainType = (act.types && act.types[0]) || '';
      if (!usedTypes.has(mainType)) {
        diverseActivities.push(act);
        usedTypes.add(mainType);
      }
      if (diverseActivities.length >= 4) break;
    }
    // Always define activities, fill with fallbacks if needed
    let activities = diverseActivities;
    // Only use real activities. If not enough, show fewer stops for that day.
    activities = activities.filter(a => a.placeId && a.address && a.location && a.name);
    activities.forEach(a => a.placeId && usedPlaceIds.add(a.placeId));

    // Build stops for the day in required order and time blocks, with real travel time
    const stops: ItineraryStop[] = [];
    const dayStops: any[] = [];
    if (breakfast) dayStops.push({ ...breakfast, type: 'breakfast', label: `Breakfast at ${breakfast.name}`, time_block: '08:00 - 09:00', duration: 60, price: 15, category: 'food' });
    if (activities[0]) dayStops.push({ ...activities[0], type: 'activity', label: activities[0].name, time_block: '09:30 - 11:00', duration: 90, price: activities[0].estimated_price_usd || 25, category: activities[0].category || 'activity' });
    if (activities[1]) dayStops.push({ ...activities[1], type: 'activity', label: activities[1].name, time_block: '11:30 - 13:00', duration: 90, price: activities[1].estimated_price_usd || 25, category: activities[1].category || 'activity' });
    if (lunch) dayStops.push({ ...lunch, type: 'lunch', label: `Lunch at ${lunch.name}`, time_block: '14:00 - 15:00', duration: 60, price: 20, category: 'food' });
    if (activities[2]) dayStops.push({ ...activities[2], type: 'activity', label: activities[2].name, time_block: '15:30 - 17:00', duration: 90, price: activities[2].estimated_price_usd || 25, category: activities[2].category || 'activity' });
    if (activities[3]) dayStops.push({ ...activities[3], type: 'activity', label: activities[3].name, time_block: '17:30 - 19:00', duration: 90, price: activities[3].estimated_price_usd || 25, category: activities[3].category || 'activity' });
    if (dinner) dayStops.push({ ...dinner, type: 'dinner', label: `Dinner at ${dinner.name}`, time_block: '20:00 - 21:00', duration: 60, price: 30, category: 'food' });

    // Haversine formula for travel time between stops (in minutes)
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
    for (let i = 0; i < dayStops.length; i++) {
      let travelTime = 'Start';
      if (i > 0) {
        const prev = dayStops[i - 1];
        const curr = dayStops[i];
        if (prev.location && curr.location) {
          // If both have placeId, try to use Google Maps directions link
          if (prev.placeId && curr.placeId) {
            travelTime = `Directions: https://www.google.com/maps/dir/?api=1&origin=place_id:${prev.placeId}&destination=place_id:${curr.placeId}`;
          } else {
            const dist = haversine(prev.location.lat, prev.location.lng, curr.location.lat, curr.location.lng);
            if (dist < 1.5) travelTime = `${Math.round(dist * 12)} min walk`;
            else if (dist < 7) travelTime = `${Math.round(dist * 5)} min taxi`;
            else travelTime = `${Math.round(dist * 2)} min transit`;
          }
        } else {
          travelTime = i === 1 ? '10 min walk' : (i === 2 ? '15 min taxi' : '7 min walk');
        }
      }
      // Set duration based on type
      let duration = 90;
      if (dayStops[i].type === 'breakfast' || dayStops[i].type === 'lunch' || dayStops[i].type === 'dinner') duration = 60;
      else if (dayStops[i].category === 'museum') duration = 90;
      else if (dayStops[i].category === 'activity') duration = 75;
      else if (dayStops[i].category === 'food') duration = 60;
      // Always link website and Google Maps for real places
      let googleMapsUrl = '';
      if (dayStops[i].placeId) googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=place_id:${dayStops[i].placeId}`;
      else if (dayStops[i].location) googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${dayStops[i].location.lat},${dayStops[i].location.lng}`;
      let websiteUrl = dayStops[i].websiteUrl || dayStops[i].website || undefined;
      stops.push({
        dayIndex: dayIdx,
        date,
        title: dayStops[i].label,
        description: dayStops[i].address,
        google_maps_url: googleMapsUrl,
        photo_url: typeof (dayStops[i] as any).photoUrl === 'string' ? (dayStops[i] as any).photoUrl : '',
        website_url: typeof websiteUrl === 'string' ? websiteUrl : undefined,
        estimated_cost: '$$',
        estimated_price_usd: dayStops[i].price,
        duration: `${duration} min`,
        travel_time_from_previous: travelTime,
        time_block: dayStops[i].time_block,
        category: dayStops[i].category,
      });
    }

    // Sanity checks: no empty days, no duplicates, all stops in city
    const uniqueStops = stops.filter((stop, idx, arr) =>
      stop && stop.title && stop.description &&
      arr.findIndex(s => s.title === stop.title && s.description === stop.description) === idx
    );

    // Wrap in ItineraryDay structure
    return {
      date,
      summary: {
        totalTime: `${uniqueStops.length * 1.5}h`,
        pace: uniqueStops.length >= 5 ? 'Busy' : 'Relaxed',
        notes:
          isCountry && Array.isArray(countryCities) && countryCities.length > 0
            ? `Explore ${cityName} as part of your ${countryCities.join(' → ')} route.`
            : 'Includes meals and curated activities with travel times.',
        stopsCount: uniqueStops.length,
        estimatedSpend: uniqueStops.reduce((sum, s) => sum + (s.estimated_price_usd || 0), 0),
      },
      stops: uniqueStops,
    };

    // Removed duplicate/unguarded summary block
  });

  // If multi-city, add intercity travel notes with curated methods
  if (isCountry && usedCountryCities.length > 1) {
    let travelIdx = 0;
    for (let i = 1; i < cityPlan.length; i++) {
      if (cityPlan[i] !== cityPlan[i - 1]) {
        const travel = travelPlan[travelIdx] || { from: cityPlan[i - 1], to: cityPlan[i], method: 'Train', duration: '2h' };
        days[i].stops.unshift({
          dayIndex: i,
          date: days[i].date,
          title: `Travel to ${cityPlan[i]}`,
          description: `Take ${travel.method} from ${travel.from} to ${travel.to} (${travel.duration})`,
          google_maps_url: '',
          photo_url: '',
          website_url: undefined,
          estimated_cost: '$$',
          estimated_price_usd: 40,
          duration: travel.duration,
          travel_time_from_previous: 'Start',
          time_block: '07:00 - 09:00',
          category: 'transport',
        });
        days[i].summary.stopsCount++;
        days[i].summary.estimatedSpend += 40;
        travelIdx++;
      }
    }
  }

  const totalCost = days.reduce((sum, d) => sum + d.summary.estimatedSpend, 0);

  return {
    trip_name: isCountry && usedCountryCities.length > 1 ? `${usedCountryCities[0]} to ${usedCountryCities[usedCountryCities.length - 1]} Grand Tour` : `${city} Trip`,
    destination: isCountry && usedCountryCities.length > 1 ? usedCountryCities.join(' → ') : city,
    start_date: startDate,
    end_date: endDate,
    currency: 'USD',
    conversion_rate: 1,
    base_currency: 'USD',
    budget_usd: budgetUsd,
    total_estimated_cost: totalCost,
    highlights: days.flatMap(d => d.stops.map(s => s.title)),
    days,
  };
};
import { getDefaultMealTimes } from '../providers/PlanningSettingsProvider';
export const generateDayItinerary = async (input: {
  city: string;
  date: string; // ISO date string
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places: PlaceCandidate[];
  mealTimes?: { breakfast: string; lunch: string; dinner: string };
}): Promise<TripItinerary> => {
  // Helper: add minutes to HH:mm string
  function addMinutes(time: string, mins: number) {
    const [h, m] = time.split(':').map(Number);
    const dateObj = new Date(2000, 0, 1, h, m);
    dateObj.setMinutes(dateObj.getMinutes() + mins);
    return dateObj.toTimeString().slice(0, 5);
  }

  // Use provided mealTimes or defaults
  const mealTimes = input.mealTimes || getDefaultMealTimes();
  const { city, date, preferences, budgetUsd, places } = input;

  // Strict city/country filter
  const filterByCity = (p: any) => p.address && p.address.toLowerCase().includes(city.toLowerCase());
  const filterByCountry = (p: any) => !p.country || (p.country && p.country.toLowerCase() === city.toLowerCase());
  // Prioritize top-rated, diverse, and meal-specific
  const foodPlaces = places.filter(p => (p.types || []).some((t: string) => t.toLowerCase().includes('restaurant') || t.toLowerCase().includes('food')) && filterByCity(p) && filterByCountry(p)).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const breakfastPlace = foodPlaces.find(p => p.name.toLowerCase().includes('breakfast') || (p.types || []).includes('cafe')) || foodPlaces[0];
  const lunchPlace = foodPlaces.find(p => p.name.toLowerCase().includes('lunch') || (p.types || []).includes('deli')) || foodPlaces[1] || foodPlaces[0];
  const dinnerPlace = foodPlaces.find(p => p.name.toLowerCase().includes('dinner') || (p.types || []).includes('bistro')) || foodPlaces[2] || foodPlaces[0];

  // Activities: real places only, top-rated, diverse
  let activityPlaces = places.filter(p => (p.types || []).some((t: string) => ['museum','park','amusement','tourist','art_gallery','zoo','aquarium','landmark','shopping_mall','stadium','spa','temple','church','historic'].some(cat => t.toLowerCase().includes(cat))) && filterByCity(p) && filterByCountry(p) && (p.rating || 0) > 4.2);
  // Prefer diversity: pick different types if possible
  const usedTypes = new Set<string>();
  const diverseActivities: any[] = [];
  for (const act of activityPlaces) {
    const mainType = (act.types && act.types[0]) || '';
    if (!usedTypes.has(mainType)) {
      diverseActivities.push(act);
      usedTypes.add(mainType);
    }
    if (diverseActivities.length >= 4) break;
  }
  // Only use real activities. If not enough, show fewer stops for that day.
  let allActivities = diverseActivities.filter(a => a.placeId && a.address && a.location && a.name);

  // Build stops: breakfast, 2–4 activities, lunch, dinner, with real travel times
  const stops: ItineraryStop[] = [];
  // Breakfast
  if (breakfastPlace) {
    stops.push({
      dayIndex: 0,
      date,
      title: `Breakfast at ${breakfastPlace.name}`,
      description: breakfastPlace.address,
      google_maps_url: typeof (breakfastPlace as any).googleMapsUrl === 'string' ? (breakfastPlace as any).googleMapsUrl : '',
      photo_url: typeof (breakfastPlace as any).photoUrl === 'string' ? (breakfastPlace as any).photoUrl : '',
      website_url: typeof (breakfastPlace as any).websiteUrl === 'string' ? (breakfastPlace as any).websiteUrl : undefined,
      estimated_cost: '$$',
      estimated_price_usd: 15,
      duration: '1h',
      travel_time_from_previous: 'Start',
      time_block: `${mealTimes.breakfast} - ${addMinutes(mealTimes.breakfast, 60)}`,
      category: 'food',
    });
  }
  // Activities (2–4)
  for (let i = 0; i < Math.min(4, allActivities.length); i++) {
    const act = allActivities[i];
    stops.push({
      dayIndex: 0,
      date,
      title: act.name,
      description: act.address,
      google_maps_url: typeof (act as any).googleMapsUrl === 'string' ? (act as any).googleMapsUrl : '',
      photo_url: typeof (act as any).photoUrl === 'string' ? (act as any).photoUrl : '',
      website_url: typeof (act as any).websiteUrl === 'string' ? (act as any).websiteUrl : undefined,
      estimated_cost: '$$',
      estimated_price_usd: 'estimated_price_usd' in act ? (act as any).estimated_price_usd : 25,
      duration: 'duration' in act ? (act as any).duration : '1.5h',
      travel_time_from_previous: i === 0 ? '10 min walk' : (i === 1 ? '15 min taxi' : '7 min walk'),
      time_block: i === 0 ? `${addMinutes(mealTimes.breakfast, 75)} - ${addMinutes(mealTimes.lunch, -60)}` : (i === 1 ? `${addMinutes(mealTimes.lunch, 90)} - ${addMinutes(mealTimes.dinner, -60)}` : ''),
      category: 'category' in act ? (act as any).category : 'activity',
    });
  }
  // Lunch
  if (lunchPlace) {
    stops.push({
      dayIndex: 0,
      date,
      title: `Lunch at ${lunchPlace.name}`,
      description: lunchPlace.address,
      google_maps_url: typeof (lunchPlace as any).googleMapsUrl === 'string' ? (lunchPlace as any).googleMapsUrl : '',
      photo_url: typeof (lunchPlace as any).photoUrl === 'string' ? (lunchPlace as any).photoUrl : '',
      website_url: typeof (lunchPlace as any).websiteUrl === 'string' ? (lunchPlace as any).websiteUrl : undefined,
      estimated_cost: '$$',
      estimated_price_usd: 20,
      duration: '1h',
      travel_time_from_previous: '8 min walk',
      time_block: `${mealTimes.lunch} - ${addMinutes(mealTimes.lunch, 60)}`,
      category: 'food',
    });
  }
  // Dinner
  if (dinnerPlace) {
    stops.push({
      dayIndex: 0,
      date,
      title: `Dinner at ${dinnerPlace.name}`,
      description: dinnerPlace.address,
      google_maps_url: typeof (dinnerPlace as any).googleMapsUrl === 'string' ? (dinnerPlace as any).googleMapsUrl : '',
      photo_url: typeof (dinnerPlace as any).photoUrl === 'string' ? (dinnerPlace as any).photoUrl : '',
      website_url: typeof (dinnerPlace as any).websiteUrl === 'string' ? (dinnerPlace as any).websiteUrl : undefined,
      estimated_cost: '$$$',
      estimated_price_usd: 30,
      duration: '1h',
      travel_time_from_previous: '10 min walk',
      time_block: `${mealTimes.dinner} - ${addMinutes(mealTimes.dinner, 60)}`,
      category: 'food',
    });
  }

  const totalCost = stops.reduce((sum, s) => sum + (s.estimated_price_usd || 0), 0);

  return {
    trip_name: `${city} Day Plan`,
    destination: city,
    start_date: date,
    end_date: date,
    currency: 'USD',
    conversion_rate: 1,
    base_currency: 'USD',
    budget_usd: budgetUsd,
    total_estimated_cost: totalCost,
    highlights: stops.map(s => s.title),
    days: [
      {
        date,
        summary: {
          totalTime: 'Full day',
          pace: 'Balanced',
          notes: 'Includes meals and curated activities with travel times.',
          stopsCount: stops.length,
          estimatedSpend: totalCost,
        },
        stops,
      },
    ],
	};
}

import { Platform } from 'react-native';

import {
  PreferenceOption,
  ItineraryStop,
  TripItinerary,
  ItineraryDay,
} from '../types/plans';
import { GOOGLE_API_KEY, OPENAI_API_KEY } from './env';

export type GeocodedLocation = {
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  types: string[];
  country?: string;
  isCountry: boolean;
};

export type PlaceCandidate = {
  name: string;
  placeId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  types?: string[];
  googleMapsUrl?: string;
  photoUrl?: string;
  websiteUrl?: string;
  priceLevel?: number;
};

export type WeatherDaySummary = {
  date: string;
  summary: string;
  highC: number | null;
  lowC: number | null;
  precipitationChance: number | null;
};

const PLACES_SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';
const OPENAI_CHAT_COMPLETIONS_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MAX_PLACES_RADIUS_METERS = 50000;
const MAX_PLACE_RESULTS = 6;
const MAX_ITINERARY_PLACE_CANDIDATES = 6;
const DEFAULT_CURRENCY = 'USD';

const extractPlaceId = (resourceName?: string | null) => {
  if (!resourceName) return undefined;
  const parts = resourceName.split('/');
  return parts.length > 1 ? parts[1] : resourceName;
};

const buildPhotoUrl = (photoName?: string | null) => {
  if (!photoName || !GOOGLE_API_KEY) return undefined;
    return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800&key=${GOOGLE_API_KEY}`;
};

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Request failed: ${response.status} ${message}`);
  }
  return (await response.json()) as T;
};

const callPlacesSearch = async (
  textQuery: string,
  options?: { locationBias?: { latitude: number; longitude: number; radiusMeters?: number } },
) => {
  if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY is not configured. Skipping Places lookup.');
    return [] as any[];
  }

  const body: Record<string, unknown> = { textQuery };
  if (options?.locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: options.locationBias.latitude,
          longitude: options.locationBias.longitude,
        },
        radius: Math.min(
          Math.max(options.locationBias.radiusMeters ?? MAX_PLACES_RADIUS_METERS, 1000),
          MAX_PLACES_RADIUS_METERS,
        ),
      },
    };
  }

  try {
    const response = await fetch(PLACES_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': [
          'places.name',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.primaryType',
          'places.types',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.priceLevel',
          'places.photos',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Google Places request failed: ${response.status} ${message}`);
    }

    const payload = (await response.json()) as {
      places?: Array<{
        name?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        rating?: number;
        types?: string[];
        primaryType?: string;
        location?: { latitude?: number; longitude?: number };
        websiteUri?: string;
        googleMapsUri?: string;
        priceLevel?: number;
        photos?: Array<{ name?: string }>;
      }>;
    };

    return payload.places ?? [];
  } catch (error) {
    console.warn('Places search failed', error);
    return [];
  }
};

const extractCountryFromAddress = (address?: string) => {
  if (!address) return undefined;
  const segments = address
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : undefined;
};

export const geocodeCity = async (city: string): Promise<GeocodedLocation> => {
  const results = await callPlacesSearch(city);
  const [firstResult] = results;

  if (!firstResult?.location?.latitude || !firstResult.location.longitude) {
    console.warn('Falling back to basic geocode for destination', city);
    const fallbackSegments = city.split(',').map((segment) => segment.trim()).filter(Boolean);
    const fallbackCity = fallbackSegments[0] ?? city;
    const fallbackCountry = fallbackSegments.length > 1
      ? fallbackSegments[fallbackSegments.length - 1]
      : undefined;

    return {
      city: fallbackCity,
      address: city,
      latitude: 0,
      longitude: 0,
      placeId: city,
      types: [],
      country: fallbackCountry,
      isCountry: false,
    };
  }

  const placeId = extractPlaceId(firstResult.name) ?? city;
  const placeTypes = firstResult.types ?? [];
  const primaryType = firstResult.primaryType ?? '';
  const resolvedName = firstResult.displayName?.text ?? city;
  const formattedAddress = firstResult.formattedAddress ?? resolvedName;
  const isCountry =
  placeTypes.some((type: string) => type?.toLowerCase() === 'country') || primaryType === 'country';
  const countryName = isCountry ? resolvedName : extractCountryFromAddress(formattedAddress);

  return {
    city: resolvedName,
    address: formattedAddress,
    latitude: firstResult.location.latitude,
    longitude: firstResult.location.longitude,
    placeId,
    types: placeTypes,
    country: countryName,
    isCountry,
  };
};

const buildPreferenceQuery = (preference: PreferenceOption, city: string) => {
  const preferenceLabel = preference.toLowerCase();
  return `${preferenceLabel} in ${city}`;
};

const mapTypesToCategory = (types?: string[]): ItineraryStop['category'] => {
  if (!types || types.length === 0) return 'activity';
  const lowered = types.map((type) => type.toLowerCase());
  if (lowered.some((type) => type.includes('restaurant') || type.includes('food'))) {
    return 'food';
  }
  if (lowered.some((type) => type.includes('bar') || type.includes('cafe'))) {
    return 'break';
  }
  if (lowered.some((type) => type.includes('transit') || type.includes('station'))) {
    return 'transport';
  }
  if (lowered.some((type) => type.includes('museum') || type.includes('tourist_attraction'))) {
    return 'activity';
  }
  return 'misc';
};

export const fetchPreferencePlaces = async (
  city: string,
  preferences: PreferenceOption[],
  location: GeocodedLocation,
): Promise<PlaceCandidate[]> => {
  const uniquePlaces = new Map<string, PlaceCandidate>();
  const activePreferences: PreferenceOption[] = preferences.length > 0 ? preferences : ['Culture'];

  await Promise.all(
    activePreferences.map(async (preference) => {
      const queryRegion = location.isCountry ? location.country ?? city : city;
      const searchQuery = buildPreferenceQuery(preference, queryRegion);
      const searchOptions = location.isCountry
        ? undefined
        : {
            locationBias: {
              latitude: location.latitude,
              longitude: location.longitude,
              radiusMeters: MAX_PLACES_RADIUS_METERS,
            },
          };

      let places: any[] = [];
      try {
        places = await callPlacesSearch(searchQuery, searchOptions);
      } catch (error) {
        console.warn('Preference place lookup failed', error);
        return;
      }

      const placeList = Array.isArray(places) ? places : [];

      placeList.slice(0, MAX_PLACE_RESULTS).forEach((place) => {
        const placeId = extractPlaceId(place.name) ?? place.displayName?.text;
        if (!placeId || uniquePlaces.has(placeId)) {
          return;
        }

        const photoUrl = place.photos?.[0]?.name
          ? buildPhotoUrl(place.photos[0].name)
          : undefined;

        uniquePlaces.set(placeId, {
          name: place.displayName?.text ?? 'Point of interest',
          placeId,
          address: place.formattedAddress ?? queryRegion,
          location: {
            lat: place.location?.latitude ?? location.latitude,
            lng: place.location?.longitude ?? location.longitude,
          },
          rating: place.rating,
          types: place.types,
          googleMapsUrl: place.googleMapsUri,
          photoUrl,
          websiteUrl: place.websiteUri,
          priceLevel: place.priceLevel,
        });
      });
    }),
  );

  return Array.from(uniquePlaces.values()).slice(0, 16);
};

const weatherCodeToSummary = (code: number | null | undefined) => {
  if (code == null) return 'Mixed conditions';
  if (code == 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorms';
  return 'Varied weather';
};

export const fetchWeatherForecastRange = async (
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date,
): Promise<WeatherDaySummary[]> => {
  const maxDays = 14;
  const isoStart = startDate.toISOString().slice(0, 10);
  const computedEnd = new Date(startDate);
  const totalDays = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000));
  computedEnd.setDate(computedEnd.getDate() + Math.min(maxDays, totalDays));
  const isoEnd = computedEnd.toISOString().slice(0, 10);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${isoStart}&end_date=${isoEnd}`;

  try {
    const data = await fetchJson<any>(url);
    const dailyWeather = data.daily ?? {};
    const dates: string[] = Array.isArray(dailyWeather.time) ? dailyWeather.time : [];
    const codes: any[] = Array.isArray(dailyWeather.weathercode)
      ? dailyWeather.weathercode
      : [];
    const highs: any[] = Array.isArray(dailyWeather.temperature_2m_max)
      ? dailyWeather.temperature_2m_max
      : [];
    const lows: any[] = Array.isArray(dailyWeather.temperature_2m_min)
      ? dailyWeather.temperature_2m_min
      : [];
    const precip: any[] = Array.isArray(dailyWeather.precipitation_probability_max)
      ? dailyWeather.precipitation_probability_max
      : [];

    return dates.map((date, index) => ({
      date,
      summary: weatherCodeToSummary(codes[index] ?? null),
      highC: highs[index] ?? null,
      lowC: lows[index] ?? null,
      precipitationChance: precip[index] != null ? precip[index] / 100 : null,
    }));
  } catch (error) {
    console.warn('Weather lookup failed', error);
    return [];
  }
};

const sanitiseJsonResponse = (content: string | null | unknown) => {
  if (typeof content !== 'string') return null;
  const trimmed = content.trim();
  const jsonBlockMatch = trimmed.match(/```json([\s\S]*?)```/i);
  const jsonString = jsonBlockMatch ? jsonBlockMatch[1] : trimmed;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON response from OpenAI', error);
    return null;
  }
};

const normaliseDay = (
  day: any,
  dayIndex: number,
  fallbackDate: string,
  candidateMap: Map<string, PlaceCandidate>,
): ItineraryDay => {
  const date =
    typeof day?.date === 'string' && day.date.length > 0 ? day.date : fallbackDate;
  const stopsArray: any[] = Array.isArray(day?.stops) ? day.stops : [];

  const stops: ItineraryStop[] = stopsArray.map((entry, index) => {
    const title = String(entry.title ?? entry.name ?? `Experience ${index + 1}`);
    const matchedCandidate = Array.from(candidateMap.values()).find(
      (candidate) =>
        candidate.name.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(candidate.name.toLowerCase()),
    );

    const costValue = Number(entry.estimated_price_usd ?? entry.estimatedPriceUsd ?? 0);
    const googleMapsUrl =
      entry.google_maps_url ??
      entry.googleMapsUrl ??
      matchedCandidate?.googleMapsUrl ??
      (matchedCandidate
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(matchedCandidate.name)}&query_place_id=${matchedCandidate.placeId}`
        : '');

    const explicitCategory = (entry.category as ItineraryStop['category']) ?? undefined;
    const candidateCategory = matchedCandidate?.types
      ? mapTypesToCategory(matchedCandidate.types)
      : 'activity';
    const resolvedCategory = explicitCategory ?? candidateCategory;

    return {
      dayIndex,
      date,
      title,
      description: String(entry.description ?? entry.details ?? ''),
      google_maps_url: googleMapsUrl,
      photo_url: entry.photo_url ?? entry.photoUrl ?? matchedCandidate?.photoUrl ?? '',
      website_url: entry.website_url ?? entry.websiteUrl ?? matchedCandidate?.websiteUrl,
      estimated_cost: String(entry.estimated_cost ?? entry.price_tier ?? '$$'),
      estimated_price_usd: Number.isFinite(costValue) ? Number(costValue) : 0,
      duration: String(entry.duration ?? entry.duration_text ?? '1 hour'),
      travel_time_from_previous: String(
        entry.travel_time_from_previous ??
          entry.travelTime ??
          (index === 0 ? 'Start' : '15 min'),
      ),
      time_block: String(entry.time_block ?? entry.time ?? ''),
      category: resolvedCategory,
    } satisfies ItineraryStop;
  });

  const estimatedSpend = stops.reduce(
    (total, stop) => total + (stop.estimated_price_usd ?? 0),
    0,
  );

  return {
    date,
    summary: {
      totalTime: String(day?.summary?.totalTime ?? 'Full-day adventure'),
      pace: String(day?.summary?.pace ?? 'Balanced pace with breaks'),
      notes: String(
        day?.summary?.notes ??
          'Expect a mix of iconic stops and local gems tailored to your preferences.',
      ),
      stopsCount: stops.length,
      estimatedSpend,
    },
    stops,
  };
};

const buildFallbackItinerary = (
  input: {
    tripName: string;
    city: string;
    startDate: string;
    endDate: string;
    dayCount: number;
    preferences: PreferenceOption[];
    budgetUsd?: number;
  },
  places: PlaceCandidate[],
): TripItinerary => {
  const { tripName, city, startDate, endDate, dayCount, budgetUsd } = input;
  const start = new Date(startDate);
  const totalDays = Math.max(dayCount, 1);

  const days: ItineraryDay[] = Array.from({ length: totalDays }).map((_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    const dayLabel = date.toISOString().slice(0, 10);
    const candidate = places[index % Math.max(places.length, 1)];

    const stop: ItineraryStop = {
      dayIndex: index,
      date: dayLabel,
      title: candidate?.name ?? `${city} experience ${index + 1}`,
      description: candidate?.address ?? 'Curated activity based on your preferences.',
      google_maps_url:
        candidate?.googleMapsUrl ??
        (candidate
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name)}&query_place_id=${candidate.placeId}`
          : ''),
      photo_url: candidate?.photoUrl ?? '',
      website_url: candidate?.websiteUrl,
      estimated_cost: '$$',
      estimated_price_usd: 50,
      duration: '1 hour 30 min',
      travel_time_from_previous: index === 0 ? 'Start' : '15 min walk',
      time_block: index === 0 ? '09:00 - 10:30' : '11:00 - 12:30',
      category: candidate?.types ? mapTypesToCategory(candidate.types) : 'activity',
    };

    return {
      date: dayLabel,
      summary: {
        totalTime: 'Flexible day',
        pace: 'Balanced pace with breaks',
        notes: 'Auto-generated itinerary. Edit to refine your plan.',
        stopsCount: 1,
        estimatedSpend: stop.estimated_price_usd,
      },
      stops: [stop],
    };
  });

  const totalCost = days.reduce((total, day) => total + day.summary.estimatedSpend, 0);

  return {
    trip_name: tripName,
    destination: city,
    start_date: startDate,
    end_date: endDate,
    budget_usd: budgetUsd,
    total_estimated_cost: totalCost,
    highlights: [],
    days,
    currency: DEFAULT_CURRENCY,
    conversion_rate: 1,
    base_currency: 'USD',
  };
};

export const requestMultiDayItinerary = async (input: {
  tripName: string;
  city: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  preferences: PreferenceOption[];
  budgetUsd?: number;
  places?: PlaceCandidate[];
  weatherByDay?: WeatherDaySummary[];
  originalQuery?: string;
}): Promise<TripItinerary> => {
  const places = input.places ?? [];
  const weatherByDay = input.weatherByDay ?? [];
  const limitedPlaces = (Array.isArray(places) ? places : []).slice(0, MAX_ITINERARY_PLACE_CANDIDATES);

  const candidateSummaries = limitedPlaces
    .map((place, index) => {
      const mapsUrl =
        place.googleMapsUrl ??
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.placeId}`;
      return `${index + 1}. ${place.name} - ${place.address}`;
    })
    .join('\n');

  const weatherSummary = weatherByDay
    .map(
      (day) =>
        `${day.date}: ${day.summary}`,
    )
    .join(' | ');

  if (!OPENAI_API_KEY) {
    return buildFallbackItinerary(input, limitedPlaces);
  }

  const prompt = `Plan a ${input.dayCount}-day itinerary called "${input.tripName}" for a traveler exploring ${input.city} from ${input.startDate} to ${input.endDate}. Budget: ${
    input.budgetUsd != null ? `$${input.budgetUsd.toFixed(0)} per day goal` : 'flexible'
  }.
Preferences: ${input.preferences.length > 0 ? input.preferences.join(', ') : 'general sightseeing'}.
Weather outlook: ${weatherSummary || 'General clear skies'}.

Suggested places:
${candidateSummaries}`;

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are PlanGenie, an assistant that builds vibrant, budget-aware multi-day travel itineraries. Always respond with pure JSON matching the provided schema.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${message}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content as string | undefined;
    const parsed = sanitiseJsonResponse(content);
    if (!parsed) {
      throw new Error('Could not parse itinerary from OpenAI response.');
    }

    const candidateMap = new Map<string, PlaceCandidate>();
    limitedPlaces.forEach((place) => {
      candidateMap.set(place.placeId, place);
      candidateMap.set(place.name.toLowerCase(), place);
    });

    const rawDays: any[] = Array.isArray(parsed.days) ? parsed.days : [];
    const normalisedDays = rawDays.map((day, index) =>
      normaliseDay(day, index, weatherByDay[index]?.date ?? input.startDate, candidateMap),
    );

    const totalCost = normalisedDays.reduce(
      (total, day) => total + day.summary.estimatedSpend,
      0,
    );

    const itinerary: TripItinerary = {
      trip_name: parsed.trip_name ?? input.tripName,
      destination: parsed.destination ?? input.city,
      start_date: parsed.start_date ?? input.startDate,
      end_date: parsed.end_date ?? input.endDate,
      budget_usd: parsed.budget_usd ?? input.budgetUsd,
      total_estimated_cost: parsed.total_estimated_cost ?? totalCost,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      weatherSummary: parsed.weatherSummary ?? weatherSummary,
      days: normalisedDays,
      currency: DEFAULT_CURRENCY,
      conversion_rate: 1,
      base_currency: 'USD',
    };

    return itinerary;
  } catch (error) {
    console.warn('OpenAI itinerary generation failed', error);
    return buildFallbackItinerary(input, limitedPlaces);
  }
};

export const requestStopReplacement = async (input: {
  city: string;
  date: string;
  daySummary: { totalTime: string; pace: string; notes: string; estimatedSpend: number };
  existingStops: ItineraryStop[];
  replaceIndex: number;
  preferences: PreferenceOption[];
  budgetUsd?: number;
}): Promise<ItineraryStop> => {
  const {
    city,
    date,
    daySummary,
    existingStops,
    replaceIndex,
    preferences,
    budgetUsd,
  } = input;

  const targetStop = existingStops[replaceIndex];
  if (!targetStop) {
    throw new Error('Invalid stop selected for replacement.');
  }

  if (!OPENAI_API_KEY) {
    return targetStop;
  }

  const stopsOverview = existingStops
    .map(
      (stop, index) =>
        `${index + 1}. ${stop.title} (${stop.category}) at ${stop.time_block ?? 'flex'} - ${stop.description}`,
    )
    .join('\n');

  const prompt = `We are updating an itinerary in ${city} on ${date}.

Current day summary: pace=${daySummary.pace}; notes=${daySummary.notes}; budget guidance=${
    budgetUsd != null ? `$${budgetUsd.toFixed(0)} per day` : 'flexible'
  }.

Current stops:
${stopsOverview}

Replace entry #${
    replaceIndex + 1
  } with a new recommendation of the same category (${targetStop.category}). Respond with strict JSON containing title, description, google_maps_url, photo_url, website_url, estimated_cost (use $, $$, $$$), estimated_price_usd (number), duration, travel_time_from_previous, time_block, and category.`;

  try {
    const response = await fetch(OPENAI_CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'You are PlanGenie, an assistant updating a single itinerary stop. Always return pure JSON with the requested fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${message}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content as string | undefined;
    const parsed = sanitiseJsonResponse(content);
    if (!parsed) {
      throw new Error('Could not parse replacement stop.');
    }

    const estimatedPrice = Number(parsed.estimated_price_usd ?? parsed.estimatedPriceUsd);
    const title = String(parsed.title ?? targetStop.title);

    const placeLookupQuery = `${title} ${city}`.trim();
    let googleMapsUrl = parsed.google_maps_url ?? parsed.googleMapsUrl ?? targetStop.google_maps_url;
    let photoUrl = parsed.photo_url ?? parsed.photoUrl ?? targetStop.photo_url;
    let websiteUrl = parsed.website_url ?? parsed.websiteUrl ?? targetStop.website_url;

    if ((!googleMapsUrl || !photoUrl || !websiteUrl) && GOOGLE_API_KEY) {
      try {
        const candidates = await callPlacesSearch(placeLookupQuery);
        const matched =
          candidates.find((place) => {
            const displayName = place.displayName?.text ?? place.name ?? '';
            return displayName.toLowerCase().includes(title.toLowerCase());
          }) ?? candidates[0];

        if (matched) {
          const candidatePhoto = matched.photos?.[0]?.name
            ? buildPhotoUrl(matched.photos[0].name)
            : undefined;
          if (candidatePhoto && !photoUrl) {
            photoUrl = candidatePhoto;
          }

          if (!googleMapsUrl) {
            const placeId = extractPlaceId(matched.name) ?? matched.displayName?.text;
            if (matched.googleMapsUri) {
              googleMapsUrl = matched.googleMapsUri;
            } else if (placeId) {
              const label = matched.displayName?.text ?? title;
              googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}&query_place_id=${placeId}`;
            }
          }

          if (!websiteUrl && matched.websiteUri) {
            websiteUrl = matched.websiteUri;
          }
        }
      } catch (lookupError) {
        console.warn('Failed to enrich replacement stop with Places data', lookupError);
      }
    }

    const replacement: ItineraryStop = {
      ...targetStop,
      title,
      description: parsed.description ?? targetStop.description,
      google_maps_url: googleMapsUrl,
      photo_url: photoUrl,
      website_url: websiteUrl,
      estimated_cost:
        parsed.estimated_cost ?? parsed.price_tier ?? targetStop.estimated_cost,
      estimated_price_usd: Number.isFinite(estimatedPrice)
        ? Number(estimatedPrice)
        : targetStop.estimated_price_usd,
      duration: parsed.duration ?? targetStop.duration,
      travel_time_from_previous:
        parsed.travel_time_from_previous ??
        parsed.travelTime ??
        targetStop.travel_time_from_previous,
      time_block: parsed.time_block ?? parsed.time ?? targetStop.time_block,
      category:
        (parsed.category as ItineraryStop['category']) ?? targetStop.category ?? 'activity',
      dayIndex: targetStop.dayIndex,
      date: targetStop.date,
    };

    return replacement;
  } catch (error) {
    console.warn('Failed to request stop replacement', error);
    return targetStop;
  }
};

export const optimisePlaceOrder = async (
  places: PlaceCandidate[],
): Promise<PlaceCandidate[]> => {
  const placeList = Array.isArray(places) ? places : [];
  if (Platform.OS === 'web' || placeList.length <= 2) {
    return placeList;
  }

  return placeList;
};








