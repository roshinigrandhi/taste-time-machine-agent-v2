export type TasteCategory = 'artists' | 'movies' | 'food' | 'places';

export interface TasteInput {
  artists: string[];
  movies: string[];
  food: string[];
  places: string[];
}

export interface TastePattern {
  title: string;
  description: string;
  tags: string[];
}

export interface Recommendation {
  id?: string;
  name: string;
  category: TasteCategory;
  reason: string;
  match: number; // 0-100
}

export interface WeekendPlanItem {
  day: 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  activity: string;
  category: TasteCategory;
}

export interface DiscoveryResult {
  era: {
    label: string;
    decade: string;
    blurb: string;
  };
  city: {
    name: string;
    country: string;
    blurb: string;
  };
  patterns: TastePattern[];
  recommendations: Recommendation[];
  weekendPlan: WeekendPlanItem[];
}

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export const CATEGORY_META: Record<TasteCategory, { label: string; icon: string }> = {
  artists: { label: 'Artists', icon: 'music' },
  movies: { label: 'Movies', icon: 'film' },
  food: { label: 'Food', icon: 'utensils' },
  places: { label: 'Places', icon: 'map-pin' },
};
