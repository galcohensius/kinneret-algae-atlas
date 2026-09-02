"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

type ClaimFirstOccurrenceFn = (slug: string) => boolean;

const GlossaryLinkScopeContext = createContext<ClaimFirstOccurrenceFn | null>(null);

/**
 * Page-local scope: each term slug is linked only on its first appearance.
 * Uses a ref so claim state survives provider re-renders and matches SSR output.
 */
export function GlossaryLinkScopeProvider({ children }: { children: ReactNode }) {
  const seenSlugsRef = useRef(new Set<string>());

  const claimFirstOccurrence = useCallback((slug: string) => {
    if (seenSlugsRef.current.has(slug)) {
      return false;
    }
    seenSlugsRef.current.add(slug);
    return true;
  }, []);

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
