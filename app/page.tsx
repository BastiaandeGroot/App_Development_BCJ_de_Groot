'use client';

import { useState, useCallback } from 'react';
import { ingest } from '@/src/intake.ts';
import { combineSources } from '@/src/merge.ts';
import { buildFeedReport } from '@/src/report.ts';
import type { FeedReport } from '@/src/types.ts';
import Dashboard, { type DisplayInfo } from '@/components/Dashboard';

interface CombineInfo { matched: number; onlyFeed: number; onlyMaster: number; eanConflicts: number; }

export default function Home() {
  const [report, setReport] = useState<FeedReport | null>(null);
  const [display, setDisplay] = useState<Map<string, DisplayInfo>>(new Map());
  const [combineInfo, setCombineInfo] = useState<CombineInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  const analyzeFiles = useCallback((files: { name: string; text: string }[]) => {
    setBusy(true);
    setError(null);
    setFileNames(files.map((f) => f.name));
    setTimeout(() => {
      try {
        let feed = null as ReturnType<typeof ingest> | null;
        let master = null as ReturnType<typeof ingest> | null;
        for (const f of files) {
          const intake = ingest(f.name, f.text);
          if (intake.kind === 'feed') feed = intake;
          else master = intake;
        }
        const merged = combineSources(feed, master);
        if (merged.primary.length === 0) throw new Error('Geen producten gevonden in de aangeleverde bestanden.');

        const src = (feed?.source ?? master?.source ?? 'onbekend') + ` [${merged.primaryKind}]`;
        const masterProducts = merged.primaryKind === 'feed' && master ? master.products : undefined;
        const rep = buildFeedReport(src, merged.primary, masterProducts);
        const map = new Map<string, DisplayInfo>();
        for (const p of merged.primary) {
          const id = p.sourceId ?? p.sku ?? '';
          map.set(id, { image: p.imageLink, url: p.url, brand: p.brand, category: p.mainCategoryPath ?? p.categories[0]?.path });
        }
        setDisplay(map);
        setReport(rep);
        setCombineInfo(feed && master ? merged.summary : null);
      } catch (e) {
        setError((e as Error).message);
        setReport(null);
      } finally {
        setBusy(false);
      }
    }, 30);
  }, []);

  const readAndAnalyze = useCallback((fileList: File[]) => {
    if (fileList.length === 0) return;
    setBusy(true);
    Promise.all(
      fileList.slice(0, 2).map(
        (file) => new Promise<{ name: string; text: string }>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve({ name: file.name, text: String(r.result) });
          r.onerror = () => reject(new Error(`Kon ${file.name} niet lezen.`));
          r.readAsText(file);
        }),
      ),
    ).then(analyzeFiles).catch((e) => { setError((e as Error).message); setBusy(false); });
  }, [analyzeFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    readAndAnalyze(Array.from(e.dataTransfer.files || []));
  }, [readAndAnalyze]);

  const loadSample = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch('/sample_feed.csv');
      analyzeFiles([{ name: 'sample_feed.csv', text: await res.text() }]);
    } catch {
      setError('Kon de voorbeeldfeed niet laden.');
      setBusy(false);
    }
  }, [analyzeFiles]);

  const reset = () => { setReport(null); setCombineInfo(null); setFileNames([]); setError(null); };

  return (
    <div className="min-h-screen">
      <TopBar onReset={report ? reset : undefined} />

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
              Upload je productfeed (Channable / Google Shopping) en zie direct — per product én over de
              hele catalogus — of de data volledig en machineleesbaar genoeg is voor agentic commerce.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-line bg-white p-6 shadow-card">
            <label
              htmlFor="file"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
                dragOver ? 'border-brand bg-brand-soft/60' : 'border-line hover:border-brand hover:bg-brand-soft/40'
              }`}
            >
              <UploadIcon />
              <span className="mt-3 text-sm font-medium text-ink">
                {fileNames.length ? fileNames.join(' + ') : 'Sleep je feed hierheen of klik om te kiezen'}
              </span>
              <span className="mt-1 text-xs text-subtle">Feed: CSV (Channable / Google Shopping)</span>
              <input
                id="file" type="file" accept=".csv,.json,text/csv,application/json,application/octet-stream" multiple className="hidden"
                onChange={(e) => { readAndAnalyze(Array.from(e.target.files || [])); e.target.value = ''; }}
              />
            </label>

            <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-center text-xs text-subtle">
              Optioneel: voeg óók je <span className="font-medium text-ink">Magento/PIM-export (JSON)</span> toe —
              sleep beide bestanden tegelijk. De feed wordt geanalyseerd en de master gebruikt om gaten te duiden.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <button onClick={loadSample} className="rounded-lg bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-hover">
                Probeer met voorbeeldfeed
              </button>
            </div>

            {busy && <p className="mt-4 text-center text-sm text-subtle">Bezig met analyseren…</p>}
            {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-laag ring-1 ring-red-200">{error}</p>}
          </div>

          <p className="mt-6 text-center text-xs text-subtle">
            De analyse draait volledig in je browser. Er wordt geen data geüpload.
          </p>
        </main>
      ) : (
        <>
          {combineInfo && (
            <div className="mx-auto max-w-6xl px-4 pt-4">
              <div className="rounded-xl border border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm text-brand-dark">
                <span className="font-medium">Twee bronnen gecombineerd</span> — {combineInfo.matched} producten gekoppeld op SKU/EAN
                {combineInfo.onlyFeed > 0 && ` · ${combineInfo.onlyFeed} alleen in feed`}
                {combineInfo.onlyMaster > 0 && ` · ${combineInfo.onlyMaster} alleen in master`}
                {combineInfo.eanConflicts > 0 && ` · ${combineInfo.eanConflicts} EAN-conflict(en)`}.
              </div>
            </div>
          )}
          <Dashboard report={report} display={display} />
        </>
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
