// Presentatie-helpers: vertaal labels/ernst naar vaste kleuren en iconen.
// Puur voor de weergave; de rapportagestandaard blijft de bron van waarheid.

import type { QualityLabel, Severity, Answerability } from '@/src/types.ts';

export const LABEL_STYLE: Record<QualityLabel, string> = {
  Laag: 'bg-red-50 text-laag ring-1 ring-red-200',
  Middel: 'bg-amber-50 text-middel ring-1 ring-amber-200',
  Hoog: 'bg-blue-50 text-hoog ring-1 ring-blue-200',
  Sterk: 'bg-emerald-50 text-sterk ring-1 ring-emerald-200',
};

export const LABEL_DOT: Record<QualityLabel, string> = {
  Laag: 'bg-laag',
  Middel: 'bg-middel',
  Hoog: 'bg-hoog',
  Sterk: 'bg-sterk',
};

export const SEVERITY_STYLE: Record<Severity, string> = {
  error: 'text-laag',
  warn: 'text-middel',
  info: 'text-subtle',
  ok: 'text-sterk',
};

export const SEVERITY_ICON: Record<Severity, string> = {
  error: '✕',
  warn: '!',
  info: 'i',
  ok: '✓',
};

export const ANSWER_STYLE: Record<Answerability, string> = {
  Ja: 'bg-emerald-50 text-sterk ring-1 ring-emerald-200',
  Deels: 'bg-amber-50 text-middel ring-1 ring-amber-200',
  Nee: 'bg-red-50 text-laag ring-1 ring-red-200',
  Indicatief: 'bg-slate-100 text-subtle ring-1 ring-slate-200',
};
