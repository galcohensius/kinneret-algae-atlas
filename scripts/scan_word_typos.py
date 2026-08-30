"""Scan data/raw Word files for likely typos / source issues."""
from __future__ import annotations

import re
from pathlib import Path

from docx import Document

RULES: list[tuple[str, str | None]] = [
    (r"\bdecllined\b", "declined"),
    (r"\bcalsium\b", "calcium"),
    (r"\bchloroplats\b", "chloroplasts"),
    (r"\bphyrenoids\b", "pyrenoids"),
    (r"\bsphaerical\b", "spherical"),
    (r"\bhemisphaerical\b", "hemispherical"),
    (r"\bsperical\b", "spherical"),
    (r"\bthemocline\b", "thermocline"),
    (r"\bdistincet\b", "distinct"),
    (r"\barrannged\b", "arranged"),
    (r"May2006", "May 2006"),
    (r"\bdistinquished\b", "distinguished"),
    (r"\blenght\b", "length"),
    (r"\bwidht\b", "width"),
    (r"\boccured\b", "occurred"),
    (r"\bseperate\b", "separate"),
    (r"\benviroment", "environment"),
    (r"\bparamaters\b", "parameters"),
    (r"\babondance\b", "abundance"),
    (r"\babundace\b", "abundance"),
    (r"\babudance\b", "abundance"),
    (r"\bfiliment", "filament"),
    (r"\buntill\b", "until"),
    (r"\bthier\b", "their"),
    (r"\bwihch\b", "which"),
    (r"\bmeasuremnt", "measurement"),
    (r"\bconcentation", "concentration"),
    (r"\bconentration", "concentration"),
    (r"\bepilimnon\b", "epilimnion"),
    (r"\bhypolimnon\b", "hypolimnion"),
    (r"\bcynobacteria\b", "cyanobacteria"),
    (r"\bdinoflagelate\b", "dinoflagellate"),
    (r"\bZignematacea\b", "Zygnemataceae"),
    (r"\bZignematales\b", "Zygnematales"),
    (r"\bteh\b", "the"),
    (r"\badn\b", "and"),
    (r"\brecieve\b", "receive"),
    (r"\brecieved\b", "received"),
    (r"\bdefinately\b", "definitely"),
    (r"\boccassion", "occasion"),
    (r"\bneccess", "necess"),
    (r"\baccomodat", "accommodat"),
    (r"\bbegining\b", "beginning"),
    (r"\bexistance\b", "existence"),
    (r"\bindependant\b", "independent"),
    (r"\bdependant\b", "dependent"),
    (r"\bsuccesful\b", "successful"),
    (r"\bthresold\b", "threshold"),
    (r"\bthreshhold\b", "threshold"),
    (r"\btempature\b", "temperature"),
    (r"\btemperatue\b", "temperature"),
    (r"\btemperatues\b", "temperatures"),
    (r"\bphotsynthe", "photosynthe"),
    (r"\bphotosynte", "photosynthe"),
    (r"\bChlorophyl\b", "Chlorophyll"),
    (r"\bchlorophyl\b", "chlorophyll"),
    (r"\bgelatinuous\b", "gelatinous"),
    (r"\bmucilagae\b", "mucilage"),
    (r"\bGenus species Authority", "DELETE TEMPLATE BLOCK"),
    (r"\[Thumbnail photo here\]", "TEMPLATE leftover"),
    (r"\[to be written\]", "still a placeholder"),
    (r"\bformely\b", "formerly"),
    (r"\bformaly\b", "formally/formerly"),
    (r"\bprefered\b", "preferred"),
    (r"\bocurance\b", "occurrence"),
    (r"\bocurrence\b", "occurrence"),
    (r"\boccurance\b", "occurrence"),
    (r"\brefering\b", "referring"),
    (r"\brefered\b", "referred"),
    (r"\btransfered\b", "transferred"),
    (r"\bcontroled\b", "controlled"),
    (r"\bcharacterisitic\b", "characteristic"),
    (r"\bcharateristic\b", "characteristic"),
    (r"\bmorpholgy\b", "morphology"),
    (r"\benviromental\b", "environmental"),
    (r"\bavailible\b", "available"),
    (r"\bapproximatly\b", "approximately"),
    (r"\baproximately\b", "approximately"),
    (r"\bcomparision\b", "comparison"),
    (r"\bcorrleat", "correlat"),
    (r"\bcorelat", "correlat"),
    (r"\bsignficant", "significant"),
    (r"\bsignificanly\b", "significantly"),
    (r"\bparticuarly\b", "particularly"),
    (r"\bparticullary\b", "particularly"),
    (r"\bespecialy\b", "especially"),
    (r"\bususally\b", "usually"),
    (r"\bususaly\b", "usually"),
    (r"\bneccessary\b", "necessary"),
    (r"\bnecesary\b", "necessary"),
    (r"\bpossibile\b", "possible"),
    (r"\bpossiblity\b", "possibility"),
    (r"\bvariablity\b", "variability"),
    (r"\boppertun", "opportun"),
    (r"\bversitile\b", "versatile"),
    (r"\bintesne\b", "intense"),
    (r"\bbloomimg\b", "blooming"),
    (r"\brelativly\b", "relatively"),
    (r"\brelativley\b", "relatively"),
    (r"\bgenralist\b", "generalist"),
    (r"\binvasvie\b", "invasive"),
    (r"\bhypotheis\b", "hypothesis"),
    (r"\bcyrptic\b", "cryptic"),
    (r"\bexplaination\b", "explanation"),
    (r"\boccassionally\b", "occasionally"),
    (r"\bocasionally\b", "occasionally"),
    (r"\brareley\b", "rarely"),
    (r"\bcommmon\b", "common"),
    (r"\bcommnly\b", "commonly"),
    (r"\btypicial\b", "typical"),
    (r"\btypicially\b", "typically"),
    (r"\bbue-green\b", "blue-green"),
    (r"\bpeal off\b", "peel off"),
    (r"\bcontinous\b", "continuous"),
    (r"\badher\b", "adhere"),
    (r"\bit's name\b", "its name"),
    (r"\bPlate1\b", "Plate 1"),
    (r"\boccassion\b", "occasion"),
    (r"\btemperatue\b", "temperature"),
    (r"\bfiliments\b", "filaments"),
    (r"\bpyrneoid\b", "pyrenoid"),
    (r"\bpyreniod\b", "pyrenoid"),
    (r"\bmucilagenous\b", "mucilaginous"),
    (r"\blamelated\b", "lamellated"),
    (r"\bprobaly\b", "probably"),
    (r"\bprobabaly\b", "probably"),
    (r"\boccurence\b", "occurrence"),
    (r"\boccurance\b", "occurrence"),
    (r"\bclorophyll\b", "chlorophyll"),
    (r"\bacheive\b", "achieve"),
    (r"\bacheived\b", "achieved"),
]

TEMP_RE = re.compile(r"\b\d{1,2}oC\b")
DOUBLE_RE = re.compile(r"\b([A-Za-z]{4,})\s+\1\b", re.I)
TABLE_REF_RE = re.compile(r"\bTable\s+(\d+)\b", re.I)
SPECIES_HEADER_RE = re.compile(
    r"^(?:\d+\.?\s*)?[A-Z][a-zA-Z-]+(?:\s+[a-z][a-zA-Z-]+)?(?:\s+\([^)]+\))?.*\d{4}\s*$"
)


def section_cue(paragraphs: list[str], idx: int) -> str:
    """Walk backward for a short location cue (species / section heading)."""
    cues: list[str] = []
    for j in range(idx, -1, -1):
        t = paragraphs[j].strip()
        if not t:
            continue
        low = t.lower().rstrip(":")
        if low in {
            "ecology",
            "indicator species",
            "morphological features",
            "physiological features",
            "environmental conditions",
            "further reading",
            "cite this record as",
            "distinctive features",
            "our vision",
            "our collaborators",
        } or low.startswith("plate ") or low.startswith("figure ") or low.startswith(
            "fig."
        ):
            cues.append(t[:80])
            if len(cues) >= 2:
                break
        elif len(t) < 90 and t[0].isupper() and not t.endswith("."):
            # likely taxon / person name
            cues.append(t[:80])
            if len(cues) >= 2:
                break
    return " › ".join(reversed(cues)) if cues else "(start of file)"


def main() -> None:
    raw = Path("data/raw")
    for path in sorted(raw.glob("*.docx")):
        if "suppl" in path.name.lower() or "glossary" in path.name.lower():
            continue
        doc = Document(str(path))
        texts = [(p.text or "") for p in doc.paragraphs]
        hits: list[dict] = []

        for i, t in enumerate(texts):
            if not t.strip():
                continue
            for pat, fix in RULES:
                if fix is None:
                    continue
                for m in re.finditer(pat, t, flags=re.IGNORECASE):
                    hits.append(
                        {
                            "kind": "typo",
                            "para": i,
                            "match": m.group(0),
                            "fix": fix,
                            "ctx": t[max(0, m.start() - 45) : m.end() + 45].replace(
                                "\n", " "
                            ),
                            "cue": section_cue(texts, i),
                        }
                    )
            for m in TEMP_RE.finditer(t):
                hits.append(
                    {
                        "kind": "temp-style",
                        "para": i,
                        "match": m.group(0),
                        "fix": m.group(0).replace("oC", "°C"),
                        "ctx": t[max(0, m.start() - 40) : m.end() + 40].replace(
                            "\n", " "
                        ),
                        "cue": section_cue(texts, i),
                    }
                )
            for m in DOUBLE_RE.finditer(t):
                word = m.group(1).lower()
                if word in {
                    "that",
                    "with",
                    "from",
                    "were",
                    "have",
                    "been",
                    "this",
                    "than",
                    "when",
                    "into",
                    "over",
                    "also",
                    "only",
                    "more",
                    "most",
                    "such",
                    "each",
                    "both",
                    "same",
                    "very",
                    "well",
                    "much",
                    "many",
                    "some",
                    "like",
                    "after",
                    "before",
                    "under",
                    "above",
                    "about",
                    "between",
                    "during",
                    "within",
                    "without",
                    "through",
                    "across",
                    "along",
                    "among",
                    "around",
                    "cells",
                    "cell",
                    "lake",
                    "data",
                    "year",
                    "years",
                }:
                    continue
                hits.append(
                    {
                        "kind": "double-word",
                        "para": i,
                        "match": m.group(0),
                        "fix": f"delete repeated '{m.group(1)}'?",
                        "ctx": t[max(0, m.start() - 40) : m.end() + 40].replace(
                            "\n", " "
                        ),
                        "cue": section_cue(texts, i),
                    }
                )

        # Table reference vs caption consistency per rough species blocks
        # (simple: within whole file, collect Table captions and Table refs)
        captions = set()
        refs = set()
        for i, t in enumerate(texts):
            s = t.strip()
            if re.match(r"(?i)^Table\s+\d+", s):
                for m in TABLE_REF_RE.finditer(s):
                    captions.add(m.group(1))
            else:
                for m in TABLE_REF_RE.finditer(s):
                    # ignore "Table 1" that is the caption itself
                    refs.add((i, m.group(1), s[:120]))

        if not hits and not (refs or captions):
            continue

        print(f"\n===== {path.name} =====")
        if hits:
            for h in hits:
                print(
                    f"[{h['kind']}] Word paragraph #{h['para']} | {h['cue']}"
                )
                print(f"  '{h['match']}' → {h['fix']}")
                print(f"  …{h['ctx']}…")
        if captions or refs:
            cap_nums = sorted(captions, key=int)
            ref_nums = sorted({n for _, n, _ in refs}, key=int)
            if cap_nums or ref_nums:
                print(
                    f"[table-check] captions: {cap_nums or 'none'}; "
                    f"in-text refs: {ref_nums or 'none'}"
                )
                for i, n, cue in refs:
                    if n not in captions:
                        print(
                            f"  WARN para #{i}: refers to Table {n} but no "
                            f"Table {n} caption found in this file"
                        )
                        print(f"    cue: {cue}")


if __name__ == "__main__":
    main()
