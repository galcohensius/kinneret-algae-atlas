import { splitTaxonForItalicDisplay } from "../../lib/taxon-display";

type TaxonItalicNameProps = {
  taxon: string;
  className?: string;
};

export default function TaxonItalicName({ taxon, className }: TaxonItalicNameProps) {
  const parts = splitTaxonForItalicDisplay(taxon);
  return (
    <span className={className}>
      {parts.map((p, i) => (
        <span key={i} className={p.italic ? "taxon-scientific" : "taxon-rank-abbr"}>
          {p.text}
        </span>
      ))}
    </span>
  );
}
