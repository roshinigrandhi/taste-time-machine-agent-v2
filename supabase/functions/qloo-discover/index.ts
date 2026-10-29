// Taste Time Machine Agent — Qloo discovery edge function.
//
// Proxies requests to the Qloo Hackathon API so QLOO_API_KEY stays
// server-side and is never exposed to the browser or logs.
//
// Official docs: https://docs.qloo.com/reference/qloo-llm-hackathon-developer-guide
//   - Base URL:       https://hackathon.api.qloo.com
//   - Auth:           X-Api-Key header
//   - Entity lookup:  GET /search?query=...&types=urn:entity:artist
//   - Recommendations: GET /v2/insights?filter.type=...&signal.interests.entities=...
//   - /v2/insights is GET (params in query string, not body)
//   - Never use /recs or /recommendations (legacy)
//
// Flow:
//  1. Resolve each user-typed name to a Qloo entity ID (UUID) via /search.
//  2. Use all resolved IDs as signal.interests.entities and request
//     insights for each of the four target categories.
//  3. Transform the Qloo response into the app's DiscoveryResult shape.
//  4. On any failure (no key, network, auth, empty results), fall back to
//     clearly-labeled demo data with qlooConnected: false.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const QLOO_BASE = "https://hackathon.api.qloo.com";

type Category = "artists" | "movies" | "food" | "places";

interface TasteInput {
  artists: string[];
  movies: string[];
  food: string[];
  places: string[];
}

// Qloo `types` param for /search (resolves user-typed names to entity IDs).
const SEARCH_TYPE: Record<Category, string> = {
  artists: "urn:entity:artist",
  movies: "urn:entity:movie",
  food: "urn:entity:place",
  places: "urn:entity:destination",
};

// Qloo `filter.type` for /v2/insights (the category of recommendations).
const INSIGHTS_TYPE: Record<Category, string> = {
  artists: "urn:entity:artist",
  movies: "urn:entity:movie",
  food: "urn:entity:place",
  places: "urn:entity:destination",
};

interface QlooEntity {
  entity_id?: string;
  name?: string;
  type?: string;
  subtype?: string;
  properties?: { short_description?: string };
}

interface ResolvedEntity {
  id: string;
  name: string;
  category: Category;
}

// --------------------------- Qloo API calls ---------------------------

function authHeaders(apiKey: string): Record<string, string> {
  return { "X-Api-Key": apiKey, "Accept": "application/json" };
}

async function searchEntity(
  query: string,
  type: string,
  apiKey: string,
): Promise<QlooEntity | null> {
  const url = new URL(`${QLOO_BASE}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("types", type);
  url.searchParams.set("take", "1");
  const res = await fetch(url.toString(), { headers: authHeaders(apiKey) });
  if (!res.ok) return null;
  const data = await res.json();
  const entities: QlooEntity[] = data?.results ?? [];
  return entities[0] ?? null;
}

async function getInsights(
  filterType: string,
  entityIds: string[],
  apiKey: string,
  take = 6,
): Promise<QlooEntity[]> {
  const url = new URL(`${QLOO_BASE}/v2/insights`);
  url.searchParams.set("filter.type", filterType);
  url.searchParams.set("signal.interests.entities", entityIds.join(","));
  url.searchParams.set("take", String(take));
  url.searchParams.set("sort_by", "affinity");
  const res = await fetch(url.toString(), { headers: authHeaders(apiKey) });
  if (!res.ok) throw new Error(`Qloo insights failed (${res.status})`);
  const data = await res.json();
  // The insights response nests entities under results.entities.
  return data?.results?.entities ?? data?.results ?? data?.entities ?? [];
}

// --------------------- Response transformation ----------------------

interface Recommendation {
  id?: string;
  name: string;
  category: Category;
  reason: string;
  match: number;
}

function entityName(e: QlooEntity): string {
  return e.name ?? "Unknown";
}

function buildReason(entity: QlooEntity, input: TasteInput): string {
  const desc = entity.properties?.short_description;
  const base = "Recommended by Qloo based on your taste profile";
  return desc ? `${base}. ${desc}` : `${base}.`;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function toRecommendations(
  entities: QlooEntity[],
  category: Category,
  input: TasteInput,
): Recommendation[] {
  const seen = new Set<string>();
  const recs: Recommendation[] = [];
  for (const e of entities) {
    if (!e || !e.entity_id) continue;
    // Deduplicate by stable Qloo entity_id when available, fall back to
    // normalized name so the same item isn't rendered twice.
    const dedupeKey = e.entity_id ?? normalizeName(entityName(e));
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    recs.push({
      id: e.entity_id,
      name: entityName(e),
      category,
      reason: buildReason(e, input),
      match: Math.max(55, 95 - recs.length * 5),
    });
    if (recs.length >= 6) break;
  }
  return recs;
}

// --------------------------- Demo data ------------------------------

const ERAS = [
  { label: "Late 1970s New York", decade: "1977", blurb: "The dawn of punk, disco, and downtown cinema — a gritty, electric moment of reinvention." },
  { label: "Mid-1960s London", decade: "1965", blurb: "Mod fashion, British Invasion rock, and a cafe culture bursting with new energy." },
  { label: "Early 1990s Seattle", decade: "1992", blurb: "Flannel, grunge, cloudy coffee shops, and a do-it-yourself creative scene." },
  { label: "Late 1950s Havana", decade: "1958", blurb: "Son cubano, neon-lit streets, and a vibrant mix of Caribbean flavors and film." },
];
const CITIES = [
  { name: "Lisbon", country: "Portugal", blurb: "Tiled facades, melancholic fado music, pastel de nata, and golden-hour light over the Tagus." },
  { name: "Kyoto", country: "Japan", blurb: "Tranquil temples, matcha ceremonies, kaiseki dining, and a deep reverence for craft." },
  { name: "Mexico City", country: "Mexico", blurb: "Mural-lined streets, tacos al pastor, mariachi, and a contemporary art scene on fire." },
  { name: "Marrakech", country: "Morocco", blurb: "Spice-scented souks, rooftop tea, gnawa rhythms, and riads hidden behind ochre walls." },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function generateDemoResult(input: TasteInput) {
  const joined = [...input.artists, ...input.movies, ...input.food, ...input.places].join("|").toLowerCase();
  const seed = hashString(joined);
  const era = ERAS[Math.abs(seed) % ERAS.length];
  const city = CITIES[Math.abs(seed >> 3) % CITIES.length];

  const patterns: Array<{ title: string; description: string; tags: string[] }> = [];
  if (input.artists.length) {
    patterns.push({ title: "You lean into mood-driven, melodic work", description: "The artists you love share a focus on atmosphere and emotion over pure spectacle — you respond to texture and feeling.", tags: ["melodic", "atmospheric", "emotional"] });
  }
  if (input.movies.length) {
    patterns.push({ title: "Character stories over spectacle", description: "Your films favor human drama and distinct visual worlds — you like being transported into someone else's perspective.", tags: ["character-driven", "visually distinct", "story-rich"] });
  }
  if (input.food.length) {
    patterns.push({ title: "Bold, layered flavors", description: "Your favorite foods tend toward spice, heat, and complexity — you enjoy dishes that unfold across several tastes at once.", tags: ["bold", "layered", "spiced"] });
  }
  if (input.places.length) {
    patterns.push({ title: "Walkable, layered cities", description: "The places you love are dense and walkable, mixing old and new — you like discovering hidden corners and local texture.", tags: ["walkable", "layered", "local"] });
  }

  const recommendations: Array<{ name: string; category: string; reason: string; match: number }> = [];
  if (input.artists.length) {
    recommendations.push({ name: "Caetano Veloso", category: "artists", reason: `A Brazilian icon whose melodic warmth matches your love of ${input.artists[0]}.`, match: 88 });
    recommendations.push({ name: "Khruangbin", category: "artists", reason: "Atmospheric, globetrotting grooves that echo the textured mood you gravitate toward.", match: 81 });
  }
  if (input.movies.length) {
    recommendations.push({ name: "Cinema Paradiso (1988)", category: "movies", reason: `A love letter to film and memory, in the spirit of ${input.movies[0]}.`, match: 86 });
    recommendations.push({ name: "Past Lives (2023)", category: "movies", reason: "Quiet, character-driven longing — a natural follow-on for your taste.", match: 79 });
  }
  if (input.food.length) {
    recommendations.push({ name: "Moqueca (Brazilian fish stew)", category: "food", reason: "Layered, fragrant, and gently spiced — the complexity you already enjoy.", match: 84 });
    recommendations.push({ name: "Tagine with preserved lemon", category: "food", reason: "Slow-cooked depth that pairs with the era and city of your discovery.", match: 77 });
  }
  if (input.places.length) {
    recommendations.push({ name: `A weekend in ${city.name}`, category: "places", reason: "Walkable, layered, and full of hidden corners — exactly the texture you love.", match: 90 });
    recommendations.push({ name: `Coastal day trip from ${city.name}`, category: "places", reason: "Adds a slower, scenic counterpoint to the dense city energy.", match: 74 });
  }

  const weekendPlan = [
    { day: "Friday", time: "Evening", activity: `Arrive in ${city.name}, settle in, and find a small live-music bar`, category: "artists" },
    { day: "Saturday", time: "Morning", activity: "Wander the old quarter on foot and grab a local pastry with coffee", category: "food" },
    { day: "Saturday", time: "Afternoon", activity: "Visit a landmark and a contemporary art space", category: "places" },
    { day: "Saturday", time: "Evening", activity: "Dinner at a family-run spot known for layered, spiced dishes", category: "food" },
    { day: "Sunday", time: "Morning", activity: "Catch a matinee at a historic independent cinema", category: "movies" },
    { day: "Sunday", time: "Afternoon", activity: "Slow walk along the waterfront before heading home", category: "places" },
  ];

  return { era, city, patterns, recommendations, weekendPlan };
}

// --------------------- Live Qloo → result shape ---------------------

function pickEraFromInput(input: TasteInput): { label: string; decade: string; blurb: string } {
  const joined = [...input.artists, ...input.movies, ...input.food, ...input.places].join("|").toLowerCase();
  const seed = hashString(joined);
  return ERAS[Math.abs(seed) % ERAS.length];
}

function pickCityFromRecs(placeRecs: Recommendation[]): { name: string; country: string; blurb: string } {
  if (placeRecs.length > 0) {
    const name = placeRecs[0].name;
    return {
      name,
      country: "Recommended by Qloo",
      blurb: `${name} surfaced by Qloo as a destination that matches your taste profile.`,
    };
  }
  return CITIES[0];
}

function buildPatternsFromResolved(resolved: ResolvedEntity[]): Array<{ title: string; description: string; tags: string[] }> {
  const cats = new Set(resolved.map((r) => r.category));
  const patterns: Array<{ title: string; description: string; tags: string[] }> = [];
  if (cats.has("artists")) {
    patterns.push({ title: "Cross-domain taste around music", description: "Qloo found that your musical favorites correlate with affinities across film, food, and places — your taste is culturally connected.", tags: ["music", "cross-domain", "cultural"] });
  }
  if (cats.has("movies")) {
    patterns.push({ title: "Cinematic affinities", description: "Your film choices connect to distinctive taste clusters that Qloo used to ground its recommendations.", tags: ["cinematic", "story-rich"] });
  }
  if (cats.has("food")) {
    patterns.push({ title: "Flavor-led discovery", description: "Your food preferences informed place and destination recommendations with a strong culinary signal.", tags: ["culinary", "flavor-led"] });
  }
  if (cats.has("places")) {
    patterns.push({ title: "Place-driven taste", description: "The destinations you love shaped recommendations that reflect the cultural texture of those locations.", tags: ["place-driven", "textured"] });
  }
  return patterns;
}

function buildWeekendPlan(cityName: string): Array<{ day: string; time: string; activity: string; category: string }> {
  return [
    { day: "Friday", time: "Evening", activity: `Arrive in ${cityName}, settle in, and find a small live-music bar`, category: "artists" },
    { day: "Saturday", time: "Morning", activity: "Wander the old quarter on foot and grab a local pastry with coffee", category: "food" },
    { day: "Saturday", time: "Afternoon", activity: "Visit a landmark and a contemporary art space", category: "places" },
    { day: "Saturday", time: "Evening", activity: "Dinner at a family-run spot known for layered, spiced dishes", category: "food" },
    { day: "Sunday", time: "Morning", activity: "Catch a matinee at a historic independent cinema", category: "movies" },
    { day: "Sunday", time: "Afternoon", activity: "Slow walk along the waterfront before heading home", category: "places" },
  ];
}

// --------------------------- Handler -------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const input: TasteInput = {
      artists: Array.isArray(body?.input?.artists) ? body.input.artists : [],
      movies: Array.isArray(body?.input?.movies) ? body.input.movies : [],
      food: Array.isArray(body?.input?.food) ? body.input.food : [],
      places: Array.isArray(body?.input?.places) ? body.input.places : [],
    };

    const apiKey = Deno.env.get("QLOO_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ result: generateDemoResult(input), source: "demo", qlooConnected: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Key present → attempt a real Qloo call. On any failure, fall back to
    // demo data with qlooConnected: false so the app still works and the UI
    // honestly reports that the API is not connected.
    try {
      // 1. Resolve user-typed names to Qloo entity IDs across all categories.
      const categories: Category[] = ["artists", "movies", "food", "places"];
      const resolved: ResolvedEntity[] = [];
      for (const cat of categories) {
        for (const item of input[cat]) {
          const entity = await searchEntity(item, SEARCH_TYPE[cat], apiKey);
          if (entity?.entity_id) {
            resolved.push({ id: entity.entity_id, name: entityName(entity), category: cat });
          }
        }
      }

      if (resolved.length === 0) {
        throw new Error("Could not resolve any favorites to Qloo entities.");
      }

      const allIds = resolved.map((r) => r.id);

      // 2. Request insights for each target category using ALL resolved
      //    entities as the interest signal (cross-domain recommendations).
      const recs: Recommendation[] = [];
      for (const cat of categories) {
        const entities = await getInsights(INSIGHTS_TYPE[cat], allIds, apiKey, 6);
        recs.push(...toRecommendations(entities, cat, input));
      }

      // 3. Build the era and city from results / input.
      const era = pickEraFromInput(input);
      const placeRecs = recs.filter((r) => r.category === "places");
      const city = pickCityFromRecs(placeRecs);
      const patterns = buildPatternsFromResolved(resolved);
      const weekendPlan = buildWeekendPlan(city.name);

      const result = { era, city, patterns, recommendations: recs, weekendPlan };

      return new Response(
        JSON.stringify({ result, source: "qloo", qlooConnected: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (qlooError) {
      const message = qlooError instanceof Error ? qlooError.message : "Qloo call failed.";
      return new Response(
        JSON.stringify({ result: generateDemoResult(input), source: "demo", qlooConnected: false, qlooError: message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
