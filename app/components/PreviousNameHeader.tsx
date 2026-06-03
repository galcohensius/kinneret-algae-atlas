import TaxonItalicName from "./TaxonItalicName";
import GlossaryAwareText from "./GlossaryAwareText";
import { splitPreviousNameForDisplay } from "../../lib/previous-name-display";

type PreviousNameHeaderProps = {
  label: string;
  plain: string;
};

export default function PreviousNameHeader({ label, plain }: PreviousNameHeaderProps) {
  const { primaryTaxon, primaryAuthority, secondary } = splitPreviousNameForDisplay(plain);

  if (!primaryTaxon && !secondary) {
    return null;
  }

  return (
    <div className="algae-previous-name-block">
      <p className="algae-previous-name-label">{label}</p>
      {primaryTaxon ? (
        <p className="algae-previous-name-primary">
          <TaxonItalicName taxon={primaryTaxon} className="algae-previous-name-taxon" />
          {primaryAuthority ? (
            <>
              {" "}
              <span className="algae-previous-name-authority">
                <GlossaryAwareText text={primaryAuthority} />
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      {secondary ? (
        <p className="algae-previous-name-secondary">
          <GlossaryAwareText text={secondary} />
        </p>
      ) : null}
    </div>
  );
}
