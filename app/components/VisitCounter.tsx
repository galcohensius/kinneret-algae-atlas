"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    goatcounter?: { count: (vars?: { path?: string; title?: string }) => void };
  }
}

type VisitCounterProps = {
  /** GoatCounter site code; the counter is emitted only when this is set. */
  code: string;
};

/**
 * Anonymous, cookie-free visit counts (GoatCounter). The script counts the
 * first page load on its own; this component reports every later client-side
 * navigation, which a static export otherwise performs without a page load.
 */
export default function VisitCounter({ code }: VisitCounterProps) {
  const pathname = usePathname();
  const lastCounted = useRef(pathname);

  useEffect(() => {
    if (pathname === lastCounted.current) return;
    lastCounted.current = pathname;
    // Read the address rather than the router: it already carries basePath and the query.
    window.goatcounter?.count({
      path: location.pathname + location.search + location.hash,
    });
  }, [pathname]);

  return (
    <script
      data-goatcounter={`https://${code}.goatcounter.com/count`}
      async
      src="https://gc.zgo.at/count.js"
    />
  );
}
