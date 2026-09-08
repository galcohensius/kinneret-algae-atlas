import Link from "next/link";
import { HOME_VISUAL_INDEX_HASH } from "../../lib/index-view";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          Kinneret Algae Atlas
        </Link>
        <nav className="site-nav" aria-label="Reference material">
          <Link href="/about/">About</Link>
          <Link href="/glossary/">Glossary</Link>
          {/* Plain anchor: a hash-only change must fire hashchange so the home index can switch view. */}
          <a href={`/${HOME_VISUAL_INDEX_HASH}`}>Visual index</a>
          <Link href="/supplements/">Supplementary material</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
