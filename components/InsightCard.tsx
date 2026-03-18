"use client";

import type { NearbyFire } from "@/types";

interface FireSummary {
  count: number;
  totalAcres: number;
  mostRecent: string;
  largest: string;
}

interface InsightCardProps {
  cityName: string;
  radiusMiles: number;
  fireSummary: FireSummary;
  selectedFire: NearbyFire | null;
}

export default function InsightCard({
  cityName,
  radiusMiles,
  fireSummary,
  selectedFire,
}: InsightCardProps) {
  if (fireSummary.count === 0) {
    return (
      <div className="rounded-lg bg-emerald-900/20 border border-emerald-400/25 px-3 py-2 text-xs text-emerald-100 leading-relaxed">
        No wildfire perimeters were found within {radiusMiles} miles of {cityName}
        for 2000–2025. This indicates lower historical exposure in the selected
        radius.
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-orange-900/40 border border-orange-500/30 px-3 py-2 text-xs text-orange-200 leading-relaxed">
      {fireSummary.count} wildfire perimeters occurred within {radiusMiles} miles
      of {cityName} between 2000–2025.
      {selectedFire
        ? ` Selected fire: ${selectedFire.fireName}${
            selectedFire.year ? ` (${selectedFire.year})` : ""
          }, ${Math.round(selectedFire.acres).toLocaleString()} acres.`
        : ""}
    </div>
  );
}
