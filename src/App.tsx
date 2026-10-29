import { useState } from 'react';
import { Compass, Github, ShieldCheck } from 'lucide-react';
import type { TasteInput } from '@/types';
import type { DiscoverResponse } from '@/api';
import { discoverTaste } from '@/api';
import TasteForm from '@/components/TasteForm';
import { ResultsDisplay, LoadingState, EmptyState, ErrorState } from '@/components/ResultsDisplay';

type View = 'idle' | 'loading' | 'success' | 'error';

function App() {
  const [view, setView] = useState<View>('idle');
  const [data, setData] = useState<DiscoverResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastInput, setLastInput] = useState<TasteInput | null>(null);

  const runDiscovery = async (input: TasteInput) => {
    setLastInput(input);
    setView('loading');
    setErrorMsg('');
    try {
      const result = await discoverTaste(input);
      setData(result);
      setView('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setView('error');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500 to-warm-400 shadow-lg shadow-electric-500/20">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-tight text-white sm:text-lg">
                Taste Time Machine Agent
              </h1>
              <p className="text-[11px] text-slate-500">Powered by Qloo taste AI</p>
            </div>
          </div>
          <a
            href="https://qloo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-200 sm:inline-flex"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-success-500" />
            Secure API integration
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-4 pt-10 sm:px-6 sm:pt-16">
        <div className="animate-fade-in-up text-center">
          <span className="chip mx-auto mb-5">
            <Github className="h-3.5 w-3.5 text-electric-400" />
            Qloo Agentic AI Hackathon
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
            Travel through your taste.
            <br />
            <span className="bg-gradient-to-r from-electric-400 via-warm-400 to-accent-400 bg-clip-text text-transparent">
              Discover another era and city.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
            Tell us what you love — artists, movies, food, and places. We'll find the patterns in your taste and
            recommend new experiences inspired by a different time and place.
          </p>
        </div>
      </section>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="space-y-8">
          <TasteForm onSubmit={runDiscovery} loading={view === 'loading'} />

          {view === 'idle' && <EmptyState />}
          {view === 'loading' && <LoadingState />}
          {view === 'error' && (
            <ErrorState message={errorMsg} onRetry={() => lastInput && runDiscovery(lastInput)} />
          )}
          {view === 'success' && data && <ResultsDisplay data={data} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-500 sm:px-6">
          <p>
            Taste Time Machine Agent · API keys are kept server-side and never exposed to the browser.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
