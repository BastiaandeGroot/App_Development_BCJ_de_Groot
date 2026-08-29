// Intern, bron-onafhankelijk productmodel + rapporttypes.
// Elke bron (Magento/Channable-JSON, CSV, XML, PIM) wordt door een adapter
// naar dit model vertaald, zodat de checks maar één keer geschreven hoeven te worden.

export interface NormalizedCategory {
  path: string; // bv. "Gordijnstoffen > Gesloten"
  level?: number;
  id?: string;
  url?: string;
}

export interface NormalizedVariant {
  sku?: string;
  gtin?: string;
  url?: string;
  priceAmount?: number;
  stockQty?: number;
  imageLink?: string;
  attributes: Record<string, string>;
}

// Het genormaliseerde product waarop alle checks draaien.
export interface NormalizedProduct {
  raw: Record<string, unknown>; // originele bronrecord (voor bewijs/tracing)

  // Identifiers
  sourceId?: string;
  sku?: string;
  gtin?: string; // GTIN/EAN/UPC, cijfers-only
  mpn?: string;

  // Kern
  brand?: string;
  title?: string;
  descriptionText?: string; // HTML gestript
  descriptionHtml?: string; // origineel
  shortDescription?: string;

  // Categorie
  categories: NormalizedCategory[];
  mainCategoryPath?: string;

  // Links & media
  url?: string;
  imageLink?: string;
  additionalImages: string[];

  // Prijs & voorraad
  priceAmount?: number;
  currency?: string;
  salePriceAmount?: number;
  stockQty?: number;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder' | 'unknown';

  // Policy / agent-kritiek
  deliveryTime?: string;
  returnInfo?: string;
  warranty?: string;

  // Varianten
  isVariantParent: boolean;
  variants: NormalizedVariant[];

  // Reviews
  reviewScore?: number;
  reviewCount?: number;

  // Overige category/agent-attributen (genormaliseerde key -> waarde als string)
  attributes: Record<string, string>;
}

export type Severity = 'ok' | 'info' | 'warn' | 'error';

// Eén bevinding uit een check: altijd met toelichting en waar mogelijk bewijs.
export interface Finding {
  code: string; // stabiele code, bv. "identifier.gtin.missing"
  severity: Severity;
  field?: string;
  message: string; // toelichting (NL)
  evidence?: string; // concreet bewijs uit de data
}

export type QualityLabel = 'Laag' | 'Middel' | 'Hoog' | 'Sterk';

// --- Meetlat 2: taxonomie & constraint coverage ---------------------------

// Beantwoordbaarheid van een constraint uit de beschikbare data.
export type Answerability = 'Ja' | 'Deels' | 'Nee' | 'Indicatief';

export interface ConstraintResult {
  id: string;
  label: string; // de constraint / klantvraag
  group: 'universeel' | 'policy' | 'categorie';
  intent?: string; // bv. "vergelijken", "compatibiliteit controleren"
  answerable: Answerability;
  reason?: string; // faalreden bij Deels/Nee/Indicatief
  evidence?: string;
  indicative?: boolean; // constraint is indicatief gegenereerd, niet uit echte bron
}

export interface ConstraintCoverage {
  results: ConstraintResult[];
  counts: Record<Answerability, number>;
  total: number;
  answerableRatio: string; // bv. "10/18"
  score: number; // 0-100, gewogen
  label: QualityLabel;
  topGaps: string[]; // belangrijkste onbeantwoordbare constraints
}

export interface ProductReport {
  id: string;
  title?: string;
  score: number; // 0-100
  label: QualityLabel;
  findings: Finding[];
  taxonomy: Finding[]; // bevindingen tegen de Google-taxonomiemeetlat
  constraintCoverage: ConstraintCoverage;
}

export interface FieldFillRate {
  field: string;
  filled: number;
  total: number;
  pct: number; // 0-100
}

export interface FeedReport {
  reportVersion: string; // versie van de rapportagestandaard (docs/reportingstandard.md)
  source: string;
  generatedAt: string;
  productCount: number;
  overall: {
    label: QualityLabel;
    score: number; // gemiddelde productscore, 0-100
    summary: string;
  };
  fillRates: FieldFillRate[];
  feedFindings: Finding[]; // feed-brede bevindingen (bv. dubbele GTIN's)
  taxonomy: {
    findings: Finding[]; // feed-brede taxonomiebevindingen
    googleCategoryFillPct: number; // % producten met Google Product Category
  };
  constraintCoverage: ConstraintCoverage; // feed-breed geaggregeerd
  labelDistribution: Record<QualityLabel, number>;
  products: ProductReport[];
}
