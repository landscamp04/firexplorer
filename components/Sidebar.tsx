"use client";

import { FormEvent, useState } from "react";

interface FireSummary {
  count: number;
  totalAcres: number;
  mostRecent: string;
  largest: string;
}

interface SidebarProps {
  cityName: string | null;
  radiusMiles: number;
  onRadiusChange: (value: number) => void;
  onSearch: (city: string) => void;
  fireSummary: FireSummary | null;
  loading: boolean;
  searchError: string | null;
  nearbyFiresCount: number;
  selectedFireName: string | null;
}

export default function Sidebar({
  cityName,
  radiusMiles,
  onRadiusChange,
  onSearch,
  fireSummary,
  loading,
  searchError,
  nearbyFiresCount,
  selectedFireName,
}: SidebarProps) {
  const [searchText, setSearchText] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(searchText);
  };

  return (
    <div className="absolute top-4 left-4 z-10 w-72 rounded-xl bg-black/60 backdrop-blur-sm text-white p-4 flex flex-col gap-4 shadow-lg">
      
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold leading-tight">
          California Wildfire Community Exposure Explorer
        </h1>
        <p className="text-xs text-white/60 mt-1">
          Is your community at risk?
        </p>
      </div>

      {/* Search */}
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchText}
          placeholder="Search a city..."
          className="flex-1 rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm placeholder-white/40 focus:outline-none focus:border-white/50"
          onChange={(event) => setSearchText(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-orange-600 hover:bg-orange-500 px-3 py-2 text-sm font-medium transition-colors"
        >
          Go
        </button>
      </form>
      {searchError && (
        <p className="text-xs text-rose-200">{searchError}</p>
      )}

      {/* Radius Slider */}
      <div>
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Proximity Radius</span>
          <span className="font-medium text-white">{radiusMiles} mi</span>
        </div>
        <input
          type="range"
          min={5}
          max={20}
          step={5}
          value={radiusMiles}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>5 mi</span>
          <span>10 mi</span>
          <span>15 mi</span>
          <span>20 mi</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Summary Panel */}
      {loading && (
        <p className="text-xs text-white/50 text-center">Analyzing nearby fires...</p>
      )}

      {!loading && !cityName && (
        <p className="text-xs text-white/50 text-center">
          Search a city to see wildfire exposure data
        </p>
      )}

      {!loading && cityName && fireSummary && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{cityName}</p>
          {selectedFireName && (
            <p className="text-xs text-white/60">
              Active fire: {selectedFireName}
            </p>
          )}

          {/* Insight Card */}
          <div className="rounded-lg bg-orange-900/40 border border-orange-500/30 px-3 py-2 text-xs text-orange-200 leading-relaxed">
            {fireSummary.count} wildfire perimeters occurred within {radiusMiles} miles of {cityName} between 2000–2025.
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-xs text-white/50">Nearby Fires</p>
              <p className="text-lg font-semibold">{nearbyFiresCount}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-xs text-white/50">Total Acres</p>
              <p className="text-lg font-semibold">
                {fireSummary.totalAcres.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-2 col-span-2">
              <p className="text-xs text-white/50">Most Recent</p>
              <p className="text-sm font-medium truncate">{fireSummary.mostRecent}</p>
            </div>
            <div className="rounded-lg bg-white/5 p-2 col-span-2">
              <p className="text-xs text-white/50">Largest Fire</p>
              <p className="text-sm font-medium truncate">{fireSummary.largest}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && cityName && !fireSummary && (
        <p className="text-xs text-white/50 text-center">
          No fires found within {radiusMiles} miles of {cityName}.
        </p>
      )}
    </div>
  );
}