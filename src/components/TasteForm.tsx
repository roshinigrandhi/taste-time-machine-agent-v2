import { useState } from 'react';
import { Music, Film, UtensilsCrossed, MapPin, Plus, X, Sparkles } from 'lucide-react';
import type { TasteCategory, TasteInput } from '@/types';

interface FieldConfig {
  key: TasteCategory;
  label: string;
  placeholder: string;
  icon: typeof Music;
  accent: string;
}

const FIELDS: FieldConfig[] = [
  { key: 'artists', label: 'Favorite artists', placeholder: 'e.g. Fleetwood Mac, Radiohead', icon: Music, accent: 'text-electric-400' },
  { key: 'movies', label: 'Favorite movies', placeholder: 'e.g. Amélie, Blade Runner 2049', icon: Film, accent: 'text-warm-400' },
  { key: 'food', label: 'Favorite foods', placeholder: 'e.g. ramen, biryani, tacos', icon: UtensilsCrossed, accent: 'text-accent-400' },
  { key: 'places', label: 'Favorite places', placeholder: 'e.g. Lisbon, Tokyo, New Orleans', icon: MapPin, accent: 'text-success-500' },
];

interface Props {
  onSubmit: (input: TasteInput) => void;
  loading: boolean;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 8);
}

export default function TasteForm({ onSubmit, loading }: Props) {
  const [drafts, setDrafts] = useState<Record<TasteCategory, string>>({
    artists: '',
    movies: '',
    food: '',
    places: '',
  });
  const [tags, setTags] = useState<Record<TasteCategory, string[]>>({
    artists: [],
    movies: [],
    food: [],
    places: [],
  });

  const addTag = (cat: TasteCategory) => {
    const newTags = parseTags(drafts[cat]);
    if (newTags.length === 0) return;
    setTags((prev) => ({
      ...prev,
      [cat]: [...prev[cat], ...newTags].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 8),
    }));
    setDrafts((prev) => ({ ...prev, [cat]: '' }));
  };

  const removeTag = (cat: TasteCategory, value: string) => {
    setTags((prev) => ({ ...prev, [cat]: prev[cat].filter((t) => t !== value) }));
  };

  const handleKey = (cat: TasteCategory, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(cat);
    }
  };

  const totalItems = Object.values(tags).reduce((sum, arr) => sum + arr.length, 0);
  const canSubmit = totalItems >= 2 && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ ...tags });
  };

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in-up">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-white">Tell us what you love</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add a few favorites across any categories. The more you add, the richer the discovery.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.key}>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Icon className={`h-4 w-4 ${field.accent}`} />
                {field.label}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={drafts[field.key]}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  onKeyDown={(e) => handleKey(field.key, e)}
                  placeholder={field.placeholder}
                  className="input-field"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => addTag(field.key)}
                  disabled={loading || !drafts[field.key].trim()}
                  className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-electric-500/50 hover:text-electric-400 disabled:opacity-40"
                  aria-label={`Add ${field.label}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {tags[field.key].length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags[field.key].map((tag) => (
                    <span key={tag} className="chip group">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(field.key, tag)}
                        disabled={loading}
                        className="text-slate-400 transition hover:text-error-500"
                        aria-label={`Remove ${tag}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-primary w-full sm:w-auto"
        >
          <Sparkles className="h-5 w-5" />
          {loading ? 'Discovering…' : 'Discover My Taste'}
        </button>
        <p className="text-xs text-slate-500">
          {totalItems === 0
            ? 'Add at least two favorites to begin.'
            : `${totalItems} favorite${totalItems === 1 ? '' : 's'} ready.`}
        </p>
      </div>
    </div>
  );
}
