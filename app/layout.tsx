import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteHeader from "./components/SiteHeader";
import { SITE_NAME, SITE_ORIGIN } from "../lib/site";
import VisitCounter from "./components/VisitCounter";
import "./globals.css";

/** Runs before paint so the first frame matches saved or system theme. */
const THEME_BOOTSTRAP_SCRIPT = `!function(){try{var k='kinneret-atlas-theme',s=localStorage.getItem(k),d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}}();`;

/**
 * Anonymous, cookie-free visit counts (GoatCounter). Emitted only when the
 * site code is provided at build time (production deploy workflow), so dev
 * runs and code-less builds ship no analytics at all.
 */
const GOATCOUNTER_CODE =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_GOATCOUNTER_CODE
    : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: SITE_NAME, template: `%s – ${SITE_NAME}` },
  description: "Index of algae species observed in Lake Kinneret.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body>
        <SiteHeader />
        {children}
        {GOATCOUNTER_CODE ? <VisitCounter code={GOATCOUNTER_CODE} /> : null}
      </body>
    </html>
  );
}
