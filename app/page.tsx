'use client';

import { useState, useCallback } from 'react';
import { adaptChannableFeed } from '@/src/adapters/channable.ts';
import { buildFeedReport } from '@/src/report.ts';
import type { FeedReport } from '@/src/types.ts';
import Dashboard, { type DisplayInfo } from '@/components/Dashboard';

export default function Home() {
  const [report, setReport] = useState<FeedReport | null>(null);
  const [display, setDisplay] = useState<Map<string, DisplayInfo>>(new Map());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const analyze = useCallback((text: string) => {
    setBusy(true);
    setError(null);
    // In een timeout zodat de spinner kan renderen vóór het zware werk.
    setTimeout(() => {
      try {
        const json = JSON.parse(text);
        const { source, products } = adaptChannableFeed(json);
        if (products.length === 0) throw new Error('Geen producten gevonden. Verwacht een JSON met een "products"-array.');
        const rep = buildFeedReport(source, products);
        const map = new Map<string, DisplayInfo>();
        for (const p of products) {
          const id = p.sourceId ?? p.sku ?? '';
          map.set(id, { image: p.imageLink, url: p.url, brand: p.brand, category: p.mainCategoryPath ?? p.categories[0]?.path });
        }
        setDisplay(map);
        setReport(rep);
      } catch (e) {
        setError((e as Error).message);
        setReport(null);
      } finally {
        setBusy(false);
      }
    }, 30);
  }, []);

  const onFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => analyze(String(reader.result));
    reader.onerror = () => setError('Kon het bestand niet lezen.');
    reader.readAsText(file);
  }, [analyze]);

  const loadSample = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch('/sample_feed.json');
      analyze(await res.text());
    } catch {
      setError('Kon de voorbeeldfeed niet laden.');
      setBusy(false);
    }
  }, [analyze]);

  return (
    <div className="min-h-screen">
      <TopBar onReset={report ? () => setReport(null) : undefined} />

      {!report ? (
        <main className="mx-auto max-w-3xl px-4 py-14">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Agentic commerce readiness
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Is jouw productdata klaar voor AI-agents?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-subtle">
              Upload je productfeed en zie direct — per product én over de hele catalogus —
              of de data volledig en machineleesbaar genoeg is voor agentic commerce.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-card">
            <label
              htmlFor="file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-6 py-10 text-center transition hover:border-brand hover:bg-brand-soft/40"
            >
              <UploadIcon />
              <span className="mt-3 text-sm font-medium text-ink">Sleep je feed hierheen of klik om te kiezen</span>
              <span className="mt-1 text-xs text-subtle">JSON-productfeed (Magento / Channable)</span>
              <input
                id="file" type="file" accept="application/json,.json" className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <button onClick={loadSample} className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-hover">
                Probeer met voorbeeldfeed
              </button>
              <button onClick={() => setPasteOpen((v) => !v)} className="rounded-lg border border-line px-4 py-2 font-medium text-ink transition hover:bg-surface">
                {pasteOpen ? 'Verberg plakvak' : 'Of plak JSON'}
              </button>
            </div>

            {pasteOpen && (
              <div className="mt-4">
                <textarea
                  value={pasteText} onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{ "config": {...}, "products": [...] }'
                  className="scroll-thin h-40 w-full resize-y rounded-lg border border-line p-3 font-mono text-xs text-ink outline-none focus:border-brand"
                />
                <button
                  onClick={() => analyze(pasteText)} disabled={!pasteText.trim()}
                  className="mt-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  Analyseer geplakte feed
                </button>
              </div>
            )}

            {busy && <p className="mt-4 text-center text-sm text-subtle">Bezig met analyseren…</p>}
            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-laag ring-1 ring-red-200">{error}</p>}
          </div>

          <p className="mt-6 text-center text-xs text-subtle">
            De analyse draait volledig in je browser. Er wordt geen data geüpload.
          </p>
        </main>
      ) : (
        <Dashboard report={report} display={display} />
      )}
    </div>
  );
}

function TopBar({ onReset }: { onReset?: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white">R</span>
          <span className="font-semibold text-ink">Readiness Scan</span>
          <span className="ml-1 hidden rounded-full bg-surface px-2 py-0.5 text-xs text-subtle sm:inline">productdata → agentic commerce</span>
        </div>
        {onReset && (
          <button onClick={onReset} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-surface">
            Nieuwe scan
          </button>
        )}
      </div>
    </header>
  );
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}
