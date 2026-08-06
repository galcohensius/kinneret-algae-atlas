"""Inspect chart OOXML for Dinoflagellates embedded charts."""
from __future__ import annotations

import re
from pathlib import Path
from zipfile import ZipFile

from lxml import etree

DOCX = Path("data/raw/1 Dinoflagellates 2026-06-10.docx")
NS = {"c": "http://schemas.openxmlformats.org/drawingml/2006/chart"}
A_T = "{http://schemas.openxmlformats.org/drawingml/2006/main}t"


def main() -> None:
    with ZipFile(DOCX) as z:
        rels = z.read("word/_rels/document.xml.rels").decode("utf-8")
        for rid in ["rId53", "rId71"]:
            m = re.search(rf'Id="{rid}"[^>]*Target="([^"]+)"', rels)
            print(rid, "->", m.group(1) if m else None)
            if not m:
                continue
            target = m.group(1)
            if not target.startswith("word/"):
                target = "word/" + target
            xml = z.read(target)
            root = etree.fromstring(xml)
            print(" file", target, "size", len(xml))
            for name in ["lineChart", "scatterChart", "barChart", "areaChart"]:
                if root.find(f".//c:{name}", NS) is not None:
                    print("  type", name)
            for ax_name in ["catAx", "valAx", "dateAx"]:
                for ax in root.findall(f".//c:{ax_name}", NS):
                    texts = [t.text for t in ax.findall(f".//{A_T}") if t.text]
                    print(f"  {ax_name} texts:", texts[:12])
            cats = root.findall(".//c:cat//c:pt", NS)[:8]
            for pt in cats:
                v = pt.find("c:v", NS)
                print("  cat", pt.get("idx"), v.text if v is not None else None)
            # numFmt / scaling
            for ax in root.findall(".//c:valAx", NS):
                scaling = ax.find("c:scaling", NS)
                if scaling is not None:
                    mn = scaling.find("c:min", NS)
                    mx = scaling.find("c:max", NS)
                    print(
                        "  valAx scale",
                        mn.get("val") if mn is not None else None,
                        mx.get("val") if mx is not None else None,
                    )
            print()


if __name__ == "__main__":
    main()
