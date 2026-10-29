import type { DiscoveryResult, TasteInput } from '@/types';

// Demo / sample data. This is clearly-labeled sample data used whenever the
// live Qloo API is not available (no API key, or the API call fails). It is
// deterministic-ish but rotates based on the inputs so the demo feels
// responsive to what the user typed.
//
// IMPORTANT: This is NOT real Qloo output and must always be labeled as
// "sample data" in the UI.

const ERAS = [
  { label: 'Late 1970s New York', decade: '1977', blurb: 'The dawn of punk, disco, and downtown cinema — a gritty, electric moment of reinvention.' },
  { label: 'Mid-1960s London', decade: '1965', blurb: 'Mod fashion, British Invasion rock, and a cafe culture bursting with new energy.' },
  { label: 'Early 1990s Seattle', decade: '1992', blurb: 'Flannel, grunge, cloudy coffee shops, and a do-it-yourself creative scene.' },
  { label: 'Late 1950s Havana', decade: '1958', blurb: 'Son cubano, neon-lit streets, and a vibrant mix of Caribbean flavors and film.' },
];

const CITIES = [
  { name: 'Lisbon', country: 'Portugal', blurb: 'Tiled facades, melancholic fado music, pastel de nata, and golden-hour light over the Tagus.' },
  { name: 'Kyoto', country: 'Japan', blurb: 'Tranquil temples, matcha ceremonies, kaiseki dining, and a deep reverence for craft.' },
  { name: 'Mexico City', country: 'Mexico', blurb: 'Mural-lined streets, tacos al pastor, mariachi, and a contemporary art scene on fire.' },
  { name: 'Marrakech', country: 'Morocco', blurb: 'Spice-scented souks, rooftop tea, gnawa rhythms, and riads hidden behind ochre walls.' },
];

function pickBySeed<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function seedFromInput(input: TasteInput): number {
  return hashString(
    [...input.artists, ...input.movies, ...input.food, ...input.places].join('|').toLowerCase(),
  );
}

function buildPatterns(input: TasteInput): DiscoveryResult['patterns'] {
  const patterns: DiscoveryResult['patterns'] = [];

  if (input.artists.length) {
    patterns.push({
      title: 'You lean into mood-driven, melodic work',
      description:
        'The artists you love share a focus on atmosphere and emotion over pure spectacle — you respond to texture and feeling.',
      tags: ['melodic', 'atmospheric', 'emotional'],
    });
  }
  if (input.movies.length) {
    patterns.push({
      title: 'Character stories over spectacle',
      description:
        'Your films favor human drama and distinct visual worlds — you like being transported into someone else\'s perspective.',
      tags: ['character-driven', 'visually distinct', 'story-rich'],
    });
  }
  if (input.food.length) {
    patterns.push({
      title: 'Bold, layered flavors',
      description:
        'Your favorite foods tend toward spice, heat, and complexity — you enjoy dishes that unfold across several tastes at once.',
      tags: ['bold', 'layered', 'spiced'],
    });
  }
  if (input.places.length) {
    patterns.push({
      title: 'Walkable, layered cities',
      description:
        'The places you love are dense and walkable, mixing old and new — you like discovering hidden corners and local texture.',
      tags: ['walkable', 'layered', 'local'],
    });
  }
  return patterns;
}

function buildRecommendations(input: TasteInput, era: string, city: string): DiscoveryResult['recommendations'] {
  const recs: DiscoveryResult['recommendations'] = [];

  if (input.artists.length) {
    recs.push(
      { name: 'Caetano Veloso', category: 'artists', reason: `A Brazilian icon whose melodic warmth matches your love of ${input.artists[0]}.`, match: 88 },
      { name: 'Khruangbin', category: 'artists', reason: 'Atmospheric, globetrotting grooves that echo the textured mood you gravitate toward.', match: 81 },
    );
  }
  if (input.movies.length) {
    recs.push(
      { name: 'Cinema Paradiso (1988)', category: 'movies', reason: `A love letter to film and memory, in the spirit of ${input.movies[0]}.`, match: 86 },
      { name: 'Past Lives (2023)', category: 'movies', reason: 'Quiet, character-driven longing — a natural follow-on for your taste.', match: 79 },
    );
  }
  if (input.food.length) {
    recs.push(
      { name: 'Moqueca (Brazilian fish stew)', category: 'food', reason: 'Layered, fragrant, and gently spiced — the complexity you already enjoy.', match: 84 },
      { name: 'Tagine with preserved lemon', category: 'food', reason: `Slow-cooked depth that pairs with the era and city of your discovery.`, match: 77 },
    );
  }
  if (input.places.length) {
    recs.push(
      { name: `A weekend in ${city}`, category: 'places', reason: 'Walkable, layered, and full of hidden corners — exactly the texture you love.', match: 90 },
      { name: `Coastal day trip from ${city}`, category: 'places', reason: 'Adds a slower, scenic counterpoint to the dense city energy.', match: 74 },
    );
  }
  return recs;
}

function buildWeekendPlan(city: string): DiscoveryResult['weekendPlan'] {
  return [
    { day: 'Friday', time: 'Evening', activity: `Arrive in ${city}, settle in, and find a small live-music bar`, category: 'artists' },
    { day: 'Saturday', time: 'Morning', activity: 'Wander the old quarter on foot and grab a local pastry with coffee', category: 'food' },
    { day: 'Saturday', time: 'Afternoon', activity: 'Visit a landmark and a contemporary art space', category: 'places' },
    { day: 'Saturday', time: 'Evening', activity: 'Dinner at a family-run spot known for layered, spiced dishes', category: 'food' },
    { day: 'Sunday', time: 'Morning', activity: 'Catch a matinee at a historic independent cinema', category: 'movies' },
    { day: 'Sunday', time: 'Afternoon', activity: 'Slow walk along the waterfront before heading home', category: 'places' },
  ];
}

export function generateDemoResult(input: TasteInput): DiscoveryResult {
  const seed = seedFromInput(input);
  const era = pickBySeed(ERAS, seed);
  const city = pickBySeed(CITIES, seed >> 3);

  return {
    era,
    city,
    patterns: buildPatterns(input),
    recommendations: buildRecommendations(input, era.label, city.name),
    weekendPlan: buildWeekendPlan(city.name),
  };
}
