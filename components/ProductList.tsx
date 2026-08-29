'use client';

import { useMemo, useState } from 'react';
import type { FeedReport, ProductReport, QualityLabel } from '@/src/types.ts';
import type { DisplayInfo } from '@/components/Dashboard';
import { LABEL_STYLE, LABEL_DOT, SEVERITY_STYLE, SEVERITY_ICON, ANSWER_STYLE } from '@/lib/ui.ts';

const PAGE = 25;
const FILTERS: (QualityLabel | 'Alle')[] = ['Alle', 'Laag', 'Middel', 'Hoog', 'Sterk'];

export default function ProductList({
  report,
  display,
}: {
  report: FeedReport;
  display: Map<string, DisplayInfo>;
}) {
  const [filter, setFilter] = useState<QualityLabel | 'Alle'>('Alle');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return report.products.filter((p) => {
      if (filter !== 'Alle' && p.label !== filter) return false;
      if (q && !(`${p.id} ${p.title ?? ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [report.products, filter, query]);

  const shown = filtered.slice(0, limit);

  return (
    <div className="rounded-xl border border-line bg-white shadow-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <h2 className="text-sm font-semibold text-ink">Producten</h2>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setLimit(PAGE); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f ? 'bg-ink text-white' : 'bg-surface text-subtle hover:bg-line'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
            placeholder="Zoek op titel of ID…"
            className="w-56 rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <p className="px-4 pt-3 text-xs text-subtle">
        {filtered.length.toLocaleString('nl-NL')} product(en){filter !== 'Alle' ? ` met label ${filter}` : ''}
      </p>

      {/* Rijen */}
      <ul className="divide-y divide-line">
        {shown.map((p) => (
          <ProductRow
            key={p.id}
            p={p}
            info={display.get(p.id)}
            open={openId === p.id}
            onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          />
        ))}
      </ul>

      {shown.length < filtered.length && (
        <div className="border-t border-line p-4 text-center">
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-surface"
          >
            Toon meer ({filtered.length - shown.length} resterend)
          </button>
        </div>
      )}
    </div>
  );
}

function ProductRow({
  p, info, open, onToggle,
}: {
  p: ProductReport;
  info?: DisplayInfo;
  open: boolean;
  onToggle: () => void;
}) {
  const cc = p.constraintCoverage;
  const allFindings = [...p.findings, ...p.taxonomy];
  const gaps = cc.results.filter((r) => r.answerable === 'Nee' || r.answerable === 'Deels');

  return (
    <li>
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-surface/60">
        <Thumb src={info?.image} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{p.title ?? '(zonder titel)'}</p>
          <p className="truncate text-xs text-subtle">
            ID {p.id}{info?.brand ? ` · ${info.brand}` : ''}{info?.category ? ` · ${info.category}` : ''}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Pill label={p.label} score={p.score} title="Volledigheid" />
          <Pill label={cc.label} score={cc.score} title="Klantvragen" />
        </div>
        <span className={`ml-1 shrink-0 text-subtle transition ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="grid gap-4 border-t border-line bg-surface/40 px-4 py-4 md:grid-cols-2">
          {/* Bevindingen */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Bevindingen</h3>
            {allFindings.length === 0 ? (
              <p className="text-sm text-subtle">Geen bevindingen.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {allFindings.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`mt-0.5 font-bold ${SEVERITY_STYLE[f.severity]}`}>{SEVERITY_ICON[f.severity]}</span>
                    <span className="text-ink">{f.message}{f.evidence && <span className="text-subtle"> ({f.evidence})</span>}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Beantwoordbare klantvragen (constraint coverage) */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">
              Beantwoordbare klantvragen — {cc.label} ({cc.answerableRatio})
            </h3>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {(['Ja', 'Deels', 'Nee', 'Indicatief'] as const).map((a) => (
                <span key={a} className={`rounded-full px-2 py-0.5 text-xs font-medium ${ANSWER_STYLE[a]}`}>
                  {a} {cc.counts[a]}
                </span>
              ))}
            </div>
            {gaps.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {gaps.map((r) => (
                  <li key={r.id} className="flex items-start gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${ANSWER_STYLE[r.answerable]}`}>{r.answerable}</span>
                    <span className="text-ink">{r.label}{r.reason && <span className="text-subtle"> — {r.reason}</span>}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function Thumb({ src }: { src?: string }) {
  if (!src) {
    return <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface text-subtle">—</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" loading="lazy" />;
}

function Pill({ label, score, title }: { label: QualityLabel; score: number; title: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${LABEL_STYLE[label]}`} title={title}>
      <span className={`h-1.5 w-1.5 rounded-full ${LABEL_DOT[label]}`} /> {label}
      <span className="font-normal opacity-70">{score}</span>
    </span>
  );
}
