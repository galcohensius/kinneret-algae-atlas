import studyAreaData from "../data/study-area.json";

export type StudyArea = {
  lakeName: string;
  alternateName: string;
  country: string;
  countryCode: string;
  stateProvince: string;
  region: string;
  latitude: number;
  longitude: number;
  geodeticDatum: string;
  elevationM: number;
  mapImage: string;
};

export const STUDY_AREA: StudyArea = {
  lakeName: studyAreaData.lake_name,
  alternateName: studyAreaData.alternate_name,
  country: studyAreaData.country,
  countryCode: studyAreaData.country_code,
  stateProvince: studyAreaData.state_province,
  region: studyAreaData.region,
  latitude: studyAreaData.latitude,
  longitude: studyAreaData.longitude,
  geodeticDatum: studyAreaData.geodetic_datum,
  elevationM: studyAreaData.elevation_m,
  mapImage: studyAreaData.map_image,
};

function formatDecimalDegrees(value: number, positiveSuffix: string, negativeSuffix: string): string {
  const suffix = value >= 0 ? positiveSuffix : negativeSuffix;
  return `${Math.abs(value).toFixed(3)}° ${suffix}`;
}

export function formatStudyAreaCoordinatesDecimal(): string {
  return `${formatDecimalDegrees(STUDY_AREA.latitude, "N", "S")}, ${formatDecimalDegrees(
    STUDY_AREA.longitude,
    "E",
    "W"
  )}`;
}

export function formatStudyAreaCoordinatesDms(): string {
  const latDeg = Math.floor(Math.abs(STUDY_AREA.latitude));
  const latMin = Math.round((Math.abs(STUDY_AREA.latitude) - latDeg) * 60);
  const lonDeg = Math.floor(Math.abs(STUDY_AREA.longitude));
  const lonMin = Math.round((Math.abs(STUDY_AREA.longitude) - lonDeg) * 60);
  const latSuffix = STUDY_AREA.latitude >= 0 ? "N" : "S";
  const lonSuffix = STUDY_AREA.longitude >= 0 ? "E" : "W";
  return `${latDeg}°${latMin.toString().padStart(2, "0")}′ ${latSuffix}, ${lonDeg}°${lonMin
    .toString()
    .padStart(2, "0")}′ ${lonSuffix}`;
}

/** First-mention lake name with accepted alternate in parentheses. */
export function formatStudyAreaLakeName(): string {
  return `${STUDY_AREA.lakeName} (${STUDY_AREA.alternateName})`;
}

/** One line for the home hero (text + coordinates, option A). */
export function formatStudyAreaCompactLine(): string {
  return `${formatStudyAreaLakeName()}, ${STUDY_AREA.stateProvince}, ${STUDY_AREA.country} · ${formatStudyAreaCoordinatesDecimal()} (${STUDY_AREA.geodeticDatum})`;
}

/** Short locality without coordinates. */
export function formatStudyAreaShortLine(): string {
  return `${formatStudyAreaLakeName()}, ${STUDY_AREA.stateProvince}, ${STUDY_AREA.country}`;
}

/** Citation-style locality string for APIs and LLM files. */
export function formatStudyAreaCitationLine(): string {
  return `${formatStudyAreaLakeName()}, ${STUDY_AREA.stateProvince}, ${STUDY_AREA.country} (${formatStudyAreaCoordinatesDecimal()}, ${STUDY_AREA.geodeticDatum})`;
}

export function studyAreaOpenStreetMapUrl(): string {
  const { latitude, longitude } = STUDY_AREA;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=10/${latitude}/${longitude}`;
}

export function studyAreaGoogleMapsUrl(): string {
  const { latitude, longitude } = STUDY_AREA;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function buildStudyAreaJsonLd(): Record<string, unknown> {
  return {
    "@type": "Place",
    name: formatStudyAreaLakeName(),
    address: {
      "@type": "PostalAddress",
      addressCountry: STUDY_AREA.countryCode,
      addressRegion: STUDY_AREA.stateProvince,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: STUDY_AREA.latitude,
      longitude: STUDY_AREA.longitude,
    },
  };
}

export function buildStudyAreaApiPayload(): Record<string, unknown> {
  return {
    lake_name: STUDY_AREA.lakeName,
    alternate_name: STUDY_AREA.alternateName,
    country: STUDY_AREA.country,
    country_code: STUDY_AREA.countryCode,
    state_province: STUDY_AREA.stateProvince,
    region: STUDY_AREA.region,
    coordinates: {
      decimal_degrees: formatStudyAreaCoordinatesDecimal(),
      dms: formatStudyAreaCoordinatesDms(),
      latitude: STUDY_AREA.latitude,
      longitude: STUDY_AREA.longitude,
      geodetic_datum: STUDY_AREA.geodeticDatum,
    },
    elevation_m: STUDY_AREA.elevationM,
    citation_line: formatStudyAreaCitationLine(),
    map_image: STUDY_AREA.mapImage,
    maps: {
      openstreetmap: studyAreaOpenStreetMapUrl(),
      google_maps: studyAreaGoogleMapsUrl(),
    },
  };
}
