import type { AlgaeRecord } from "./algae-types";
import { COLOR_AXIS, normalizeColor } from "./morphology-normalize";
import {
  classifyVisualShapeGroup,
  formatVisualShapeGroupLabel,
  VISUAL_SHAPE_GROUP_ORDER,
  type VisualShapeGroup,
} from "./visual-shape-group";
import { getPhylumAccent } from "./phylum-catalog";
import { partitionPlateAndGalleryImages } from "./partition-plate-images";

export type VisualIndexCell = {
  slug: string;
  scientificName: string;
  phylum: string;
  accent: string;
  imageUrl: string | null;
  col: number;
  row: number;
  shapeGroup: VisualShapeGroup;
};

export type VisualIndexSection = {
  group: VisualShapeGroup;
  label: string;
  cells: VisualIndexCell[];
};

/** Desktop column cap shared by every morphotype group that does not fit on one row. */
export const SHAPE_GROUP_MAX_COLS = 5;

function shapeGroupColumnCount(count: number): number {
  return Math.max(1, Math.min(count, SHAPE_GROUP_MAX_COLS));
}

function buildCell(record: AlgaeRecord, col: number, row: number, shapeGroup: VisualShapeGroup): VisualIndexCell {
  const phylum = (record.sections.phylum ?? "").trim() || "Unclassified";
  const { plateImage } = partitionPlateAndGalleryImages(record.images, record.imageCaptions);

  return {
    slug: record.slug,
    scientificName: record.scientificName,
    phylum,
    accent: getPhylumAccent(phylum),
    imageUrl: record.thumbnailUrl ?? plateImage ?? null,
    col,
    row,
    shapeGroup,
  };
}

export function buildVisualIndexSections(records: AlgaeRecord[]): VisualIndexSection[] {
  const sections: VisualIndexSection[] = [];

  for (const group of VISUAL_SHAPE_GROUP_ORDER) {
    const groupRecords = records
      .filter((record) => classifyVisualShapeGroup(record) === group)
      .sort((a, b) => {
        const colorA = COLOR_AXIS[normalizeColor(a.sections.color)];
        const colorB = COLOR_AXIS[normalizeColor(b.sections.color)];
        if (colorA !== colorB) return colorA - colorB;
        return a.slug.localeCompare(b.slug);
      });

    if (groupRecords.length === 0) continue;

    const cols = shapeGroupColumnCount(groupRecords.length);
    const cells = groupRecords.map((record, index) =>
      buildCell(record, index % cols, Math.floor(index / cols), group)
    );

    sections.push({
      group,
      label: formatVisualShapeGroupLabel(group),
      cells,
    });
  }

  return sections;
}
