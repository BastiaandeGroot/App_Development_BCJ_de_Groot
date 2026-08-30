'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { ingest } from '@/src/intake.ts';
import { combineSources } from '@/src/merge.ts';
import { buildFeedReport } from '@/src/report.ts';
import { buildTaxonomyIndex, type TaxonomyIndex } from '@/src/taxonomyData.ts';
import type { FeedReport } from '@/src/types.ts';
import Dashboard, { type DisplayInfo } from '@/components/Dashboard';

interface CombineInfo { matched: number; onlyFeed: number; onlyMaster: number; eanConflicts: number; }

// Officiële Google-taxonomie eenmalig ophalen (voor C2/C4). Gecachet.
let taxoPromise: Promise<TaxonomyIndex | undefined> | null = null;
function getTaxonomy(): Promise<TaxonomyIndex | undefined> {
  if (!taxoPromise) {
    taxoPromise = fetch('/google_taxonomy_with_ids.txt')
      .then((r) => (r.ok ? r.text() : null))
      .then((t) => (t ? buildTaxonomyIndex(t) : undefined))
      .catch(() => undefined);
  }
  return taxoPromise;
}

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
    setTimeout(async () => {
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

        const taxonomy = await getTaxonomy();
        const src = (feed?.source ?? master?.source ?? 'onbekend') + ` [${merged.primaryKind}]`;
        const masterProducts = merged.primaryKind === 'feed' && master ? master.products : undefined;
        const rep = buildFeedReport(src, merged.primary, masterProducts, taxonomy);
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
    <div>
      <TopBar onReset={report ? reset : undefined} />

      {!report ? (
        <main className="mx-auto max-w-2xl px-6 py-16">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium tracking-label text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> AGENTIC COMMERCE READINESS
            </span>
            <h1 className="mx-auto mt-5 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-ink">
              Is jouw productdata klaar voor AI-agents?
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-subtle">
              Upload je productfeed en zie direct — per product én over de hele catalogus —
              of je data volledig en machineleesbaar genoeg is voor agentic commerce.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-card sm:p-7">
            <label
              htmlFor="file"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                dragOver ? 'border-brand bg-brand-soft/60' : 'border-line hover:border-brand hover:bg-brand-soft/40'
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft">
                <UploadIcon />
              </span>
              <span className="mt-4 text-sm font-medium text-ink">
                {fileNames.length ? fileNames.join('  +  ') : 'Sleep je feed hierheen of klik om te kiezen'}
              </span>
              <span className="mt-1 text-xs text-subtle">CSV-productfeed (Channable / Google Shopping)</span>
              <input
                id="file" type="file" accept=".csv,.json,text/csv,application/json,application/octet-stream" multiple className="hidden"
                onChange={(e) => { readAndAnalyze(Array.from(e.target.files || [])); e.target.value = ''; }}
              />
            </label>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-xs leading-relaxed text-subtle">
              <span className="mt-px text-subtle">＋</span>
              <span>Optioneel: sleep óók je <span className="font-medium text-ink">Magento/PIM-export (JSON)</span> mee. De feed wordt geanalyseerd; de master gebruiken we om gaten te duiden.</span>
            </p>

            <button
              onClick={loadSample}
              className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-hover"
            >
              Probeer met voorbeeldfeed
            </button>

            {busy && <p className="mt-4 text-center text-sm text-subtle">Bezig met analyseren…</p>}
            {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-laag ring-1 ring-red-200">{error}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-subtle">
            <Feature>Per product én catalogus</Feature>
            <Feature>Draait privé in je browser</Feature>
            <Feature>Resultaat in seconden</Feature>
          </div>
        </main>
      ) : (
        <>
          {combineInfo && (
            <div className="mx-auto max-w-content px-6 pt-5">
              <div className="flex items-center gap-2 rounded-xl border border-brand/25 bg-brand-soft/60 px-4 py-3 text-sm text-brand-dark">
                <span className="text-brand">⇄</span>
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
    <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white shadow-card">R</span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Readiness Scan</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          <Link href="/wat-we-controleren" className="rounded-lg px-3 py-1.5 text-sm font-medium text-subtle transition hover:bg-surface hover:text-ink">
            Wat we controleren
          </Link>
          {onReset && (
            <button onClick={onReset} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink shadow-card transition hover:bg-surface">
              Nieuwe scan
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {children}
    </span>
  );
}

function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4m0 0L7 9m5-5 5 5" />
      <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
    </svg>
  );
}
