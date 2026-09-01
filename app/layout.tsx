import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
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
  title: "Kinneret Algae Atlas",
  description: "Index of algae species observed in Lake Kinneret.",
  icons: {
    icon: "/favicon.png",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
        <ThemeToggle />
        {children}
        {GOATCOUNTER_CODE ? (
          <script
            data-goatcounter={`https://${GOATCOUNTER_CODE}.goatcounter.com/count`}
            async
            src="https://gc.zgo.at/count.js"
          />
        ) : null}
      </body>
    </html>
  );
}
