import {
  Music,
  Film,
  UtensilsCrossed,
  MapPin,
  Sparkles,
  Clock,
  Compass,
  Lightbulb,
  CalendarDays,
  AlertCircle,
  Search,
} from 'lucide-react';
import type { DiscoveryResult, Recommendation, TasteCategory } from '@/types';
import type { DiscoverResponse } from '@/api';

const CATEGORY_ICON: Record<TasteCategory, typeof Music> = {
  artists: Music,
  movies: Film,
  food: UtensilsCrossed,
  places: MapPin,
};

const CATEGORY_COLOR: Record<TasteCategory, string> = {
  artists: 'text-electric-400',
  movies: 'text-warm-400',
  food: 'text-accent-400',
  places: 'text-success-500',
};

/* --------------------------- Loading state --------------------------- */
export function LoadingState() {
  return (
    <div className="glass-card animate-fade-in-up p-8 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-electric-500/15">
        <Compass className="h-7 w-7 animate-spin-slow text-electric-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">Traveling through time and taste…</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        We're analyzing your favorites to find your era, your city, and a weekend plan full of new discoveries.
      </p>
      <div className="mx-auto mt-6 grid max-w-md gap-3 text-left">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse-slow rounded-xl bg-white/[0.04]" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Empty state ----------------------------- */
export function EmptyState() {
  return (
    <div className="glass-card animate-fade-in p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warm-400/10">
        <Search className="h-7 w-7 text-warm-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">Your discovery awaits</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Add a few favorite artists, movies, foods, or places above, then press Discover to see your taste patterns and a time-traveling recommendation.
      </p>
    </div>
  );
}

/* ---------------------------- Error state ----------------------------- */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass-card animate-fade-in-up border-error-500/30 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-500/15">
        <AlertCircle className="h-7 w-7 text-error-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">Something went wrong</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{message}</p>
      <button type="button" onClick={onRetry} className="btn-primary mt-5">
        Try again
      </button>
    </div>
  );
}

/* ---------------------------- Result card ----------------------------- */
function SectionTitle({ icon: Icon, children }: { icon: typeof Music; children: string }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-white">
      <Icon className="h-5 w-5 text-electric-400" />
      {children}
    </h3>
  );
}

function MatchBar({ match }: { match: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-electric-500 to-warm-400 transition-all duration-700"
        style={{ width: `${match}%` }}
      />
    </div>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const Icon = CATEGORY_ICON[rec.category];
  return (
    <div className="glass-card group p-5 transition hover:border-electric-500/40 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
            <Icon className={`h-4.5 w-4.5 ${CATEGORY_COLOR[rec.category]}`} />
          </div>
          <div>
            <h4 className="font-medium text-white">{rec.name}</h4>
            <p className="mt-1 text-sm text-slate-400">{rec.reason}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-warm-400">{rec.match}%</span>
      </div>
      <MatchBar match={rec.match} />
    </div>
  );
}

export function ResultsDisplay({ data }: { data: DiscoverResponse }) {
  const result: DiscoveryResult = data.result;
  const isDemo = data.source === 'demo';

  // Deduplicate recommendations as a safety net: the edge function already
  // deduplicates by Qloo entity_id / normalized name, but we also guard here
  // so the UI never renders overlapping cards even if the contract changes.
  const seenKeys = new Set<string>();
  const dedupedRecs = result.recommendations.filter((rec) => {
    const key = (rec.id ?? rec.name.trim().toLowerCase()) + '|' + rec.category;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-start gap-3 rounded-xl border border-warm-400/30 bg-warm-400/10 p-4 animate-fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warm-400" />
          <div className="text-sm">
            <p className="font-medium text-warm-300">Sample data — not live Qloo results</p>
            <p className="mt-0.5 text-slate-400">
              The Qloo API isn't connected yet. This is illustrative demo content so you can preview the experience. Once an API key is added and tested, live recommendations will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Era + City hero */}
      <div className="glass-card relative overflow-hidden p-6 sm:p-8 animate-fade-in-up">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-electric-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-warm-400/10 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-2">
          <div>
            <span className="chip mb-3">
              <Clock className="h-3.5 w-3.5 text-warm-400" />
              Your era
            </span>
            <h2 className="font-display text-2xl font-bold text-white">{result.era.label}</h2>
            <p className="mt-1 text-sm font-medium text-warm-300">circa {result.era.decade}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.era.blurb}</p>
          </div>
          <div className="md:border-l md:border-white/10 md:pl-6">
            <span className="chip mb-3">
              <MapPin className="h-3.5 w-3.5 text-success-500" />
              Your city
            </span>
            <h2 className="font-display text-2xl font-bold text-white">{result.city.name}</h2>
            <p className="mt-1 text-sm font-medium text-electric-400">{result.city.country}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{result.city.blurb}</p>
          </div>
        </div>
      </div>

      {/* Patterns */}
      {result.patterns.length > 0 && (
        <div className="glass-card p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <SectionTitle icon={Lightbulb}>Your taste patterns</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.patterns.map((p) => (
              <div key={p.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h4 className="font-medium text-white">{p.title}</h4>
                <p className="mt-1.5 text-sm text-slate-400">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <span key={tag} className="chip text-xs">#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <SectionTitle icon={Sparkles}>Recommendations inspired by your taste</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {dedupedRecs.map((rec, idx) => (
              <RecCard key={rec.id ?? `${rec.name}-${rec.category}-${idx}`} rec={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Weekend plan */}
      {result.weekendPlan.length > 0 && (
        <div className="glass-card p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <SectionTitle icon={CalendarDays}>Your weekend discovery plan</SectionTitle>
          <div className="space-y-2">
            {result.weekendPlan.map((item, idx) => {
              const Icon = CATEGORY_ICON[item.category];
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="flex w-20 shrink-0 flex-col">
                    <span className="text-sm font-semibold text-warm-300">{item.day}</span>
                    <span className="text-xs text-slate-500">{item.time}</span>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Icon className={`h-4 w-4 ${CATEGORY_COLOR[item.category]}`} />
                  </div>
                  <p className="text-sm text-slate-200">{item.activity}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
