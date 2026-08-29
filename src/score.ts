// Vertaalt bevindingen naar een score (0-100) en een kwalitatief label.
// De labels komen uit het document: Laag / Middel / Hoog / Sterk.

import type { Finding, ProductReport, QualityLabel, NormalizedProduct } from './types.ts';
import { runProductChecks } from './checks/product.ts';
import { checkTaxonomy } from './checks/taxonomy.ts';
import { evaluateConstraints } from './constraints.ts';

// Strafpunten per ernst. Kritieke ontbrekende velden (error) wegen het zwaarst.
// Deze waarden en de drempels hieronder zijn de belangrijkste "afstelknoppen".
const PENALTY: Record<Finding['severity'], number> = { error: 9, warn: 5, info: 1, ok: 0 };

// Vaste sorteervolgorde voor bevindingen (rapportagestandaard §6):
// eerst op ernst (error → warn → info → ok), daarbinnen op code.
const SEVERITY_ORDER: Record<Finding['severity'], number> = { error: 0, warn: 1, info: 2, ok: 3 };

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.code.localeCompare(b.code),
  );
}

export function scoreFindings(findings: Finding[]): number {
  let score = 100;
  for (const f of findings) score -= PENALTY[f.severity];
  return Math.max(0, Math.min(100, score));
}

// Drempels zijn bewust instelbaar gehouden; hier een verdedigbare startwaarde.
export function labelForScore(score: number, hasCriticalError: boolean): QualityLabel {
  if (score >= 90 && !hasCriticalError) return 'Sterk';
  if (score >= 78) return 'Hoog';
  if (score >= 55) return 'Middel';
  return 'Laag';
}

export function buildProductReport(p: NormalizedProduct): ProductReport {
  const findings = runProductChecks(p);
  const score = scoreFindings(findings);
  const hasCriticalError = findings.some((f) => f.severity === 'error');
  return {
    id: p.sourceId ?? p.sku ?? '(onbekend)',
    title: p.title,
    score,
    label: labelForScore(score, hasCriticalError),
    findings: sortFindings(findings),
    taxonomy: sortFindings(checkTaxonomy(p)),
    constraintCoverage: evaluateConstraints(p),
  };
}
