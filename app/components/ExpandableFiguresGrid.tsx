"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ExpandableFigure = {
  src: string;
  alt: string;
};

type ExpandableFiguresGridProps = {
  figures: ExpandableFigure[];
};

/** Thumbnail grid; click opens a large view in a modal dialog. */
export default function ExpandableFiguresGrid({ figures }: ExpandableFiguresGridProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setOpenIndex(null);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (openIndex !== null) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [openIndex]);

  const open = (index: number) => setOpenIndex(index);

  const current = openIndex !== null ? figures[openIndex] : null;

  return (
    <>
      <div className="figures-grid">
        {figures.map((fig, index) => (
          <figure key={fig.src} className="figures-grid-item">
            <button
              type="button"
              className="figures-expand-trigger"
              onClick={() => open(index)}
              aria-haspopup="dialog"
              aria-expanded={openIndex === index}
              aria-label={`Enlarge figure ${index + 1}`}
            >
              <img src={fig.src} alt={fig.alt} loading="lazy" />
            </button>
          </figure>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="figure-lightbox-dialog"
        onClose={() => setOpenIndex(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        aria-label="Enlarged figure"
      >
        {current ? (
          <>
            <button type="button" className="figure-lightbox-close" onClick={close} aria-label="Close">
              ×
            </button>
            <div className="figure-lightbox-inner" onClick={(e) => e.stopPropagation()}>
              <img className="figure-lightbox-img" src={current.src} alt={current.alt} />
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
}
