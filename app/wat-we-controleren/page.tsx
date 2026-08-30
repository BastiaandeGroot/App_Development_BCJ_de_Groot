import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wat we controleren — Product Data Readiness Scan',
  description: 'In gewone taal: waar de scan naar kijkt om te bepalen of je productdata klaar is voor AI-winkelassistenten.',
};

export default function WatWeControleren() {
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm font-bold text-white shadow-card">R</span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">Readiness Scan</span>
          </Link>
          <Link href="/" className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-hover">
            Start een scan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-14">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Uitleg
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">Wat we controleren</h1>
          <p className="mx-auto mt-3 max-w-2xl text-subtle">
            Onze scan kijkt of jouw productdata klaar is voor <strong>AI-winkelassistenten</strong> —
            slimme assistenten die namens een klant producten zoeken, vergelijken en zelfs kopen.
            Hieronder lees je in gewone taal waar we naar kijken.
          </p>
        </div>

        {/* Twee niveaus */}
        <div className="mt-8 rounded-xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">We kijken op twee niveaus</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm font-medium text-ink">📊 Over je hele catalogus</p>
              <p className="mt-1 text-sm text-subtle">Een totaalbeeld: waar zitten de grootste gaten, en wat pak je het beste eerst aan?</p>
            </div>
            <div className="rounded-lg bg-surface p-4">
              <p className="text-sm font-medium text-ink">🔎 Per product</p>
              <p className="mt-1 text-sm text-subtle">Voor elk product een eigen oordeel, zodat je gericht kunt verbeteren.</p>
            </div>
          </div>
        </div>

        {/* Blokken */}
        <div className="mt-6 space-y-5">
          <Block
            emoji="📦"
            title="1. Is je productdata compleet en netjes?"
            intro="De basis moet kloppen: zonder die gegevens kan een AI je product niet goed begrijpen."
            items={[
              ['Staan de basisgegevens erin?', 'Titel, beschrijving, prijs, valuta, voorraad, beschikbaarheid, afbeelding, productlink, merk, barcode (EAN/GTIN), categorie, levertijd, retour en garantie.'],
              ['Zijn de barcodes geldig en uniek?', 'We checken of EAN/GTIN-codes kloppen en niet dubbel voorkomen — dubbele of foute codes zorgen voor verwarring bij kanalen en AI.'],
              ['Is een veld écht gevuld of maar schijn?', 'Soms lijkt een veld compleet, maar staat overal dezelfde standaardwaarde (bijvoorbeeld je eigen winkelnaam als "merk"). Dan telt het inhoudelijk niet mee.'],
              ['Staat info in nette velden?', 'Belangrijke details (zoals maat of materiaal) horen in aparte velden, niet verstopt in een lange lap beschrijvingstekst die een AI moeilijk kan uitlezen.'],
            ]}
          />
          <Block
            emoji="🗂️"
            title="2. Kan een AI je producten juist indelen?"
            intro="Producten moeten in de juiste, officiële Google-categorie staan. Zo weten externe kanalen en AI wat je verkoopt."
            items={[
              ['Heeft elk product een Google-categorie?', 'We controleren of de officiële Google-productcategorie is ingevuld.'],
              ['Bestaat de categorie echt en is die specifiek genoeg?', 'De categorie moet in de officiële Google-lijst voorkomen en niet te breed zijn (liefst een specifieke categorie, geen algemene bak).'],
              ['Is het consistent?', 'Producten uit dezelfde eigen categorie horen dezelfde Google-categorie te krijgen.'],
              ['We vertalen de categoriecode', 'Staat er een nummer (bijv. 47)? Dan tonen we de volledige naam erbij, zodat je ziet wat er werkelijk staat.'],
            ]}
          />
          <Block
            emoji="💬"
            title="3. Kan een AI klantvragen over je product beantwoorden?"
            intro="Een AI-assistent kan pas adviseren als je data de vragen van klanten kan beantwoorden. We toetsen typische vragen."
            items={[
              ['Voorbeeldvragen', '"Wat kost het (en in welke valuta)?", "Is het op voorraad?", "Wat is de levertijd?", "Kan ik het retourneren?", "Welke maat, kleur of materiaal?", "Van welk merk is het?"'],
              ['Per vraag een oordeel', 'Ja (data heeft het antwoord), Deels (staat alleen in vrije tekst), of Nee (ontbreekt). Hoe meer "Ja", hoe beter een AI je product kan aanraden.'],
              ['Policy-vragen tellen zwaar mee', 'Levertijd, verzendkosten, retour en garantie zijn cruciaal voor vertrouwen — juist die ontbreken vaak.'],
            ]}
          />
          <Block
            emoji="🔍"
            title="4. Hoe gezond is je brondata? (optioneel)"
            intro="Lever je naast de feed ook je PIM- of Magento-export aan, dan vergelijken we die twee."
            items={[
              ['Aanvulbaar', 'Ontbreekt iets in de feed maar staat het wél in je bron? Dan is het makkelijk aan te vullen — een instelkwestie.'],
              ['Echt gat', 'Ontbreekt het in allebei? Dan moet de informatie eerst gemaakt worden.'],
              ['Schijn-herstel', 'Wordt een gat in de feed "gedicht" met een standaardwaarde? Dan is je bron de zwakke plek, en dat willen we zichtbaar maken.'],
            ]}
          />
        </div>

        {/* Scores */}
        <div className="mt-6 rounded-xl border border-line bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink">Hoe we het oordeel geven</h2>
          <p className="mt-1 text-sm text-subtle">Elk product en je hele catalogus krijgen een label — van zwak naar sterk:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <ScoreChip color="bg-laag" label="Laag" note="veel ontbreekt; een AI kan hier weinig mee" />
            <ScoreChip color="bg-middel" label="Middel" note="basis aanwezig, maar belangrijke gegevens missen" />
            <ScoreChip color="bg-hoog" label="Hoog" note="grotendeels op orde, enkele verbeterpunten" />
            <ScoreChip color="bg-sterk" label="Sterk" note="compleet en goed bruikbaar voor AI" />
          </div>
        </div>

        {/* Eerlijk over grenzen */}
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Wat we (nog) niet doen</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-subtle">
            <li>• We laten nu vooral zien <strong>wat er beter kan</strong> — nog geen kant-en-klare verbeteracties.</li>
            <li>• We kijken naar je <strong>feed en bron</strong>, nog niet naar je live website.</li>
            <li>• Enkele diepere, categorie-specifieke controles volgen later met AI.</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition hover:bg-brand-hover">
            Start een scan
          </Link>
        </div>
      </main>
    </div>
  );
}

function Block({ emoji, title, intro, items }: { emoji: string; title: string; intro: string; items: [string, string][] }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>{emoji}</span>
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-subtle">{intro}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map(([head, body], i) => (
          <li key={i} className="border-l-2 border-brand/30 pl-3">
            <p className="text-sm font-medium text-ink">{head}</p>
            <p className="mt-0.5 text-sm text-subtle">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ScoreChip({ color, label, note }: { color: string; label: string; note: string }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
      </span>
      <p className="mt-1 text-xs text-subtle">{note}</p>
    </div>
  );
}
