import type Point from "@arcgis/core/geometry/Point";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type { FireAnalysisResult, NearbyFire } from "@/types";

export const FIRE_MIN_ACRES = Number(process.env.NEXT_PUBLIC_FIRE_MIN_ACRES ?? 450);
export const FIRE_WHERE = `YEAR_ >= 2000 AND YEAR_ <= 2025 AND GIS_ACRES >= ${FIRE_MIN_ACRES}`;

const FIRE_CAUSE_LABELS: Record<number, string> = {
  1: "Lightning",
  2: "Equipment Use",
  3: "Smoking",
  4: "Campfire",
  5: "Debris",
  6: "Railroad",
  7: "Arson",
  8: "Playing with Fire",
  9: "Miscellaneous",
  10: "Vehicle",
  11: "Powerline",
  12: "Firefighter Training",
  13: "Non-Firefighter Training",
  14: "Unknown / Unidentified",
  15: "Structure",
  16: "Aircraft",
  17: "Volcanic",
  18: "Escaped Prescribed Burn",
  19: "Illegal Alien Campfire",
};

export function getFireCauseLabel(causeCode: number | null): string | null {
  if (causeCode === null) return null;
  return FIRE_CAUSE_LABELS[causeCode] ?? "Unknown";
}

export async function queryFiresNearPoint(
  point: Point,
  radiusMiles: number,
  fireLayer: FeatureLayer,
  where = FIRE_WHERE
): Promise<FireAnalysisResult> {
  await fireLayer.load();

  const result = await fireLayer.queryFeatures({
    where,
    geometry: point,
    distance: radiusMiles,
    units: "miles",
    spatialRelationship: "intersects",
    returnGeometry: false,
    outFields: ["OBJECTID", "FIRE_NAME", "YEAR_", "GIS_ACRES", "CAUSE"],
  });

  const features = result.features ?? [];
  if (features.length === 0) {
    return {
      fires: [],
      summary: {
        count: 0,
        totalAcres: 0,
        mostRecent: "None in selected radius",
        largest: "None in selected radius",
      },
    };
  }

  const nearbyFires: NearbyFire[] = features.map((feature) => {
    const objectId = Number(feature.attributes?.OBJECTID ?? 0);
    const fireName = String(feature.attributes?.FIRE_NAME ?? "Unnamed fire");
    const yearRaw = Number(feature.attributes?.YEAR_);
    const acresRaw = Number(feature.attributes?.GIS_ACRES ?? 0);
    const causeRaw = Number(feature.attributes?.CAUSE);
    const causeCode = Number.isFinite(causeRaw) ? causeRaw : null;

    return {
      objectId,
      fireName,
      year: Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : null,
      acres: Number.isFinite(acresRaw) ? acresRaw : 0,
      causeCode,
      causeLabel: getFireCauseLabel(causeCode),
    };
  });

  const totalAcres = features.reduce((sum, feature) => {
    const acres = Number(feature.attributes?.GIS_ACRES ?? 0);
    return sum + (Number.isFinite(acres) ? acres : 0);
  }, 0);

  const mostRecentFeature = [...features].sort((a, b) => {
    const yearA = Number(a.attributes?.YEAR_ ?? 0);
    const yearB = Number(b.attributes?.YEAR_ ?? 0);
    return yearB - yearA;
  })[0];

  const largestFeature = [...features].sort((a, b) => {
    const acresA = Number(a.attributes?.GIS_ACRES ?? 0);
    const acresB = Number(b.attributes?.GIS_ACRES ?? 0);
    return acresB - acresA;
  })[0];

  const mostRecentName = String(
    mostRecentFeature.attributes?.FIRE_NAME ?? "Unnamed fire"
  );
  const mostRecentYear = Number(mostRecentFeature.attributes?.YEAR_ ?? 0);
  const largestName = String(largestFeature.attributes?.FIRE_NAME ?? "Unnamed fire");
  const largestAcres = Number(largestFeature.attributes?.GIS_ACRES ?? 0);

  return {
    fires: nearbyFires,
    summary: {
      count: features.length,
      totalAcres: Math.round(totalAcres),
      mostRecent:
        mostRecentYear > 0 ? `${mostRecentName} (${mostRecentYear})` : mostRecentName,
      largest: `${largestName} (${Math.round(largestAcres).toLocaleString()} acres)`,
    },
  };
}
