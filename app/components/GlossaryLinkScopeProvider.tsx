"use client";

import { createContext, useContext, type ReactNode } from "react";

type ClaimFirstOccurrenceFn = (slug: string) => boolean;

const GlossaryLinkScopeContext = createContext<ClaimFirstOccurrenceFn | null>(null);

/**
 * Page-local scope: each term slug is linked only on its first appearance.
 * The scope resets on every render pass, so output remains deterministic.
 */
export function GlossaryLinkScopeProvider({ children }: { children: ReactNode }) {
  const seenSlugs = new Set<string>();
  const claimFirstOccurrence: ClaimFirstOccurrenceFn = (slug) => {
    if (seenSlugs.has(slug)) {
      return false;
    }
    seenSlugs.add(slug);
    return true;
  };

  return (
    <GlossaryLinkScopeContext.Provider value={claimFirstOccurrence}>
      {children}
    </GlossaryLinkScopeContext.Provider>
  );
}

export function useClaimFirstGlossaryOccurrence(): ClaimFirstOccurrenceFn {
  const scope = useContext(GlossaryLinkScopeContext);
  return scope ?? (() => true);
}
