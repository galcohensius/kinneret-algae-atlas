"use client";

import { useMemo, useState } from "react";
import type { GlossaryEntry } from "../../lib/glossary-types";

type LetterGroup = {
  letter: string;
  entries: GlossaryEntry[];
};

type GlossaryPageClientProps = {
  title: string;
  recordUpdated: string;
  letters: string[];
  groups: LetterGroup[];
};

export default function GlossaryPageClient({
  title,
  recordUpdated,
  letters,
  groups,
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
                  <dd>{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
    </>
  );
}
