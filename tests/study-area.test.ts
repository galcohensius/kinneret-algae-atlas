import { describe, expect, it } from "vitest";
import {
  buildStudyAreaApiPayload,
  buildStudyAreaJsonLd,
  formatStudyAreaCitationLine,
  formatStudyAreaCoordinatesDecimal,
  formatStudyAreaCoordinatesDms,
  formatStudyAreaFooterLine,
  formatStudyAreaShortLine,
  STUDY_AREA,
  studyAreaGoogleMapsUrl,
  studyAreaOpenStreetMapUrl,
} from "../lib/study-area";

describe("study-area", () => {
  it("formats decimal coordinates in north/east hemispheres", () => {
    expect(formatStudyAreaCoordinatesDecimal()).toBe("32.833° N, 35.583° E");
  });

  it("formats DMS coordinates for the lake center", () => {
    expect(formatStudyAreaCoordinatesDms()).toBe("32°50′ N, 35°35′ E");
  });

  it("builds footer and citation locality lines", () => {
    expect(formatStudyAreaFooterLine()).toBe(
      "Lake Kinneret (Sea of Galilee), Northern District, Israel · 32.833° N, 35.583° E"
    );
    expect(formatStudyAreaShortLine()).toContain("Lake Kinneret (Sea of Galilee)");
    expect(formatStudyAreaCitationLine()).toContain("(32.833° N, 35.583° E, WGS84)");
  });

  it("exposes schema.org spatial coverage", () => {
    const jsonLd = buildStudyAreaJsonLd();
    expect(jsonLd).toMatchObject({
      "@type": "Place",
      name: "Lake Kinneret (Sea of Galilee)",
      address: {
        addressCountry: "IL",
        addressRegion: "Northern District",
      },
      geo: {
        latitude: STUDY_AREA.latitude,
        longitude: STUDY_AREA.longitude,
      },
    });
  });

  it("builds API payload with map links", () => {
    const payload = buildStudyAreaApiPayload();
    expect(payload.country_code).toBe("IL");
    expect(payload.map_image).toBe("/study-area-satellite.jpg");
    expect(payload.map_attribution).toContain("NASA");
    expect(studyAreaOpenStreetMapUrl()).toContain("openstreetmap.org");
    expect(studyAreaOpenStreetMapUrl()).toContain("#map=10/");
    expect(studyAreaGoogleMapsUrl()).toContain("google.com/maps/search/");
    expect(studyAreaGoogleMapsUrl()).toContain(",10z");
  });
});
