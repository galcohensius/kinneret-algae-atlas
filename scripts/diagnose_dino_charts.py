"""Diagnose which Dinoflagellates charts map to which species figures."""
from __future__ import annotations

import re
import sys
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from docx import Document
from lxml import etree

from algae_extractor.reader import _export_word_chart_images, _count_chart_nodes_in_docx

DOCX = ROOT / "data/raw/1 Dinoflagellates 2026-06-10.docx"


def main() -> None:
    print("chart nodes:", _count_chart_nodes_in_docx(DOCX))
    blobs = _export_word_chart_images(DOCX)
    print("word blobs:", len(blobs), [len(b) for b in blobs])

    # Walk document body in order: paragraphs text + drawing chart markers
    doc = Document(str(DOCX))
    body = doc.element.body
    ns = {
        "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
        "c": "http://schemas.openxmlformats.org/drawingml/2006/chart",
        "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    }
    current_species = "?"
    chart_idx = 0
    for child in body.iterchildren():
        tag = etree.QName(child).localname
        if tag == "p":
            texts = [t.text or "" for t in child.findall(".//w:t", ns)]
            text = "".join(texts).strip()
            if not text:
                # still may contain chart
                pass
            elif re.search(r"\b(18|19|20)\d{2}\s*$", text) and len(text) < 120:
                if not text.lower().startswith(("plate", "figure", "fig.", "table")):
                    current_species = text
            charts = child.findall(".//c:chart", ns)
            for ch in charts:
                rid = ch.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                print(f"CHART #{chart_idx} rid={rid} under species≈ {current_species!r}")
                # peek following caption-ish nearby: print next non-empty texts briefly handled outside
                chart_idx += 1
            if text.lower().startswith("figure") or text.lower().startswith("fig."):
                print(f"  CAPTION near {current_species}: {text[:140]}")


if __name__ == "__main__":
    main()
