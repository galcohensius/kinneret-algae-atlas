"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry, GlossaryPlate } from "../../lib/glossary-types";
import { publicAssetPath } from "../../lib/public-path";

type LetterGroup = {
  letter: string;
  entries: GlossaryEntry[];
};

type GlossaryPageClientProps = {
  title: string;
  recordUpdated: string;
  letters: string[];
  groups: LetterGroup[];
  plates: (GlossaryPlate & { width?: number; height?: number })[];
};

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Link every plate label (e.g. "Plate 2") in a definition to its figure. */
function renderDefinitionWithPlateLinks(definition: string, plates: GlossaryPlate[]) {
  if (plates.length === 0) return definition;
  const byLabel = new Map(plates.map((plate) => [plate.label, plate]));
  const pattern = new RegExp(`\\b(${plates.map((plate) => escapeRegExp(plate.label)).join("|")})\\b`, "g");
  return definition.split(pattern).map((part, index) => {
    const plate = byLabel.get(part);
    return plate ? (
      <a key={`${index}-${plate.id}`} href={`#${plate.id}`}>
        {part}
      </a>
    ) : (
      <span key={`${index}-text`}>{part}</span>
    );
  });
}

export default function GlossaryPageClient({
  title,
  recordUpdated,
  letters,
  groups,
  plates,
}: GlossaryPageClientProps) {
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter(
          (e) =>
            e.term.toLowerCase().includes(q) ||
            e.definition.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.entries.length > 0);
  }, [groups, query]);

  const visibleCount = filteredGroups.reduce((n, g) => n + g.entries.length, 0);
  const totalCount = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <>
      <p className="glossary-meta muted">
        {title} · Last updated {recordUpdated} · {totalCount} terms
      </p>

      <div className="glossary-toolbar">
        <label className="glossary-search-label" htmlFor="glossary-search">
          Search terms
        </label>
        <input
          id="glossary-search"
          type="search"
          className="glossary-search"
          placeholder="Filter by term or definition…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query.trim() ? (
          <p className="glossary-search-count muted">{visibleCount} matching</p>
        ) : null}
      </div>

      <nav className="glossary-letter-nav" aria-label="Jump to letter">
        {letters.map((letter) => (
          <a key={letter} href={`#letter-${letter}`}>
            {letter}
          </a>
        ))}
      </nav>

      {plates.length > 0 ? (
        <section className="glossary-plates" aria-labelledby="glossary-plates-heading">
          <h2 id="glossary-plates-heading" className="glossary-letter-heading">
            Cox (1996) reference plates
          </h2>
          {plates.map((plate) => (
            <figure key={plate.id} id={plate.id} className="plate-figure">
              <img
                src={publicAssetPath(plate.src)}
                alt={`Glossary ${plate.label} from Cox (1996)`}
                width={plate.width}
                height={plate.height}
              />
              <figcaption className="muted">{plate.label}</figcaption>
            </figure>
          ))}
        </section>
      ) : null}

      {filteredGroups.length === 0 ? (
        <p className="muted">No terms match your search.</p>
      ) : (
        filteredGroups.map((group) => (
          <section
            key={group.letter}
            className="glossary-letter-section"
            id={`letter-${group.letter}`}
            aria-labelledby={`heading-${group.letter}`}
          >
            <h2 id={`heading-${group.letter}`} className="glossary-letter-heading">
              {group.letter}
            </h2>
            <dl className="glossary-list">
              {group.entries.map((entry) => (
                <div key={entry.slug} id={entry.slug} className="glossary-entry">
                  <dt>{entry.term}</dt>
                  <dd>{renderDefinitionWithPlateLinks(entry.definition, plates)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}

    </>
  );
}
