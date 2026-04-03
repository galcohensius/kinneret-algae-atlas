import type { Metadata } from "next";
import type { ReactNode } from "react";
import ThemeToggle from "./components/ThemeToggle";
import "./globals.css";

/** Runs before paint so the first frame matches saved or system theme. */
const THEME_BOOTSTRAP_SCRIPT = `!function(){try{var k='kinneret-atlas-theme',s=localStorage.getItem(k),d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}}();`;

export const metadata: Metadata = {
  title: "Kinneret Algae Atlas",
  description: "Index of algae species observed in Lake Kinneret."
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
      </body>
    </html>
  );
}
