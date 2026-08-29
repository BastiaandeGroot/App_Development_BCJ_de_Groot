'use client';

import type { FeedReport, Finding, QualityLabel } from '@/src/types.ts';
import { LABEL_STYLE, LABEL_DOT, SEVERITY_STYLE, SEVERITY_ICON } from '@/lib/ui.ts';
import ProductList from '@/components/ProductList';

export interface DisplayInfo {
  image?: string;
  url?: string;
  brand?: string;
  category?: string;
}

const LABELS: QualityLabel[] = ['Sterk', 'Hoog', 'Middel', 'Laag'];

export default function Dashboard({
  report,
  display,
}: {
  report: FeedReport;
  display: Map<string, DisplayInfo>;
}) {
  const cc = report.constraintCoverage;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* Kop */}
      <div className="rounded-xl border border-line bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-ink">Readiness-rapport</h1>
            <p className="mt-0.5 text-sm text-subtle">
              Bron: <span className="text-ink">{report.source}</span> · {report.productCount.toLocaleString('nl-NL')} producten ·
              rapportversie {report.reportVersion}
            </p>
          </div>
          <LabelBadge label={report.overall.label} score={report.overall.score} big />
        </div>
        <p className="mt-3 text-sm text-subtle">{report.overall.summary}</p>
      </div>

      {/* Stat-tiles */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile title="Volledigheid" value={`${report.overall.score}`} suffix="/100" label={report.overall.label} />
        <Tile title="Constraint coverage" value={`${cc.score}`} suffix="/100" label={cc.label} sub={`beantwoordbaar ${cc.answerableRatio}`} />
        <Tile title="Google-categorie" value={`${report.taxonomy.googleCategoryFillPct}`} suffix="%" sub="van de producten gemapt" />
        <Tile title="Producten" value={report.productCount.toLocaleString('nl-NL')} sub="volledig geanalyseerd" />
      </div>

      {/* Verdeling + vulgraad */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Verdeling per label">
          <div className="space-y-2">
            {LABELS.map((l) => {
              const n = report.labelDistribution[l];
              const pct = report.productCount ? Math.round((n / report.productCount) * 100) : 0;
              return (
                <div key={l} className="flex items-center gap-3 text-sm">
                  <span className="flex w-16 items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${LABEL_DOT[l]}`} /> {l}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                    <div className={`h-full ${LABEL_DOT[l]}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums text-subtle">{n} · {pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Vulgraad basisvelden">
          <div className="scroll-thin max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {report.fillRates.map((f) => (
              <div key={f.field} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate text-subtle" title={f.field}>{f.field}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div className={`h-full ${f.pct < 40 ? 'bg-laag' : f.pct < 80 ? 'bg-middel' : 'bg-sterk'}`} style={{ width: `${f.pct}%` }} />
                </div>
                <span className="w-10 text-right tabular-nums text-subtle">{f.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bevindingen feed-breed */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <FindingsCard title="Volledigheid & identifiers" findings={report.feedFindings} empty="Geen feed-brede problemen." />
        <FindingsCard title="Taxonomie" findings={report.taxonomy.findings} empty="Alle producten hebben een Google-categorie." />
        <Card title="Constraint coverage — grootste gaten">
          {cc.topGaps.length === 0 ? (
            <p className="text-sm text-subtle">Alle constraints zijn beantwoordbaar.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {cc.topGaps.map((g, i) => (
                <li key={i} className="flex gap-2 text-ink">
                  <span className="text-middel">•</span> {g}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Productlijst */}
      <div className="mt-4">
        <ProductList report={report} display={display} />
      </div>
    </main>
  );
}

function LabelBadge({ label, score, big }: { label: QualityLabel; score: number; big?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${LABEL_STYLE[label]} ${big ? 'text-sm' : 'text-xs'}`}>
      <span className={`h-2 w-2 rounded-full ${LABEL_DOT[label]}`} /> {label}
      <span className="font-normal opacity-70">{score}/100</span>
    </span>
  );
}

function Tile({ title, value, suffix, sub, label }: { title: string; value: string; suffix?: string; sub?: string; label?: QualityLabel }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">{title}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        {suffix && <span className="text-sm text-subtle">{suffix}</span>}
      </p>
      {label && <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_STYLE[label]}`}>{label}</span>}
      {sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function FindingsCard({ title, findings, empty }: { title: string; findings: Finding[]; empty: string }) {
  return (
    <Card title={title}>
      {findings.length === 0 ? (
        <p className="text-sm text-subtle">{empty}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {findings.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className={`mt-0.5 font-bold ${SEVERITY_STYLE[f.severity]}`}>{SEVERITY_ICON[f.severity]}</span>
              <span className="text-ink">
                {f.message}
                {f.evidence && <span className="text-subtle"> ({f.evidence})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
