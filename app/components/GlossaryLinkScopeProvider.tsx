"use client";

import { createContext, useContext, useId, useRef, type ReactNode } from "react";

type ClaimFirstOccurrenceFn = (slug: string) => boolean;

/** slug -> useId of the text block that links it. */
const GlossaryLinkScopeContext = createContext<Map<string, string> | null>(null);

/**
 * Page-local scope: each glossary term is linked only where it first appears.
 * Ownership is recorded per text block (by its stable `useId`), so a block that
 * re-renders on its own keeps its links, while StrictMode double renders and
 * hydration reproduce the server's choice. Blocks render in document order on
 * both server and client, so the first claimant is the first occurrence.
 */
export function GlossaryLinkScopeProvider({ children }: { children: ReactNode }) {
  const owners = useRef(new Map<string, string>());
  return (
    <GlossaryLinkScopeContext.Provider value={owners.current}>
      {children}
    </GlossaryLinkScopeContext.Provider>
  );
}

/**
 * Returns a claim function for the calling text block. Within one render of the
 * block only the first occurrence of a slug is linked; across blocks the first
 * block to claim a slug owns it for the life of the page.
 */
export function useClaimFirstGlossaryOccurrence(): ClaimFirstOccurrenceFn {
  const owners = useContext(GlossaryLinkScopeContext);
  const blockId = useId();
  const seenInThisRender = new Set<string>();

  return (slug) => {
    if (seenInThisRender.has(slug)) return false;
    seenInThisRender.add(slug);
    if (!owners) return true;
    const owner = owners.get(slug);
    if (owner === undefined) {
      owners.set(slug, blockId);
      return true;
    }
    return owner === blockId;
  };
}
