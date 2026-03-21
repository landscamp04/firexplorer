"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { NearbyFire } from "@/types";
import Link from "next/link";
import InsightCard from "@/components/InsightCard";
import {
  RollingLargestFire,
  RollingMostRecent,
  RollingNumber,
} from "@/components/RollingMetric";

interface FireSummary {
  count: number;
  totalAcres: number;
  mostRecent: string;
  largest: string;
}

interface SidebarProps {
  cityName: string | null;
  radiusMiles: number;
  isFocusModeEnabled: boolean;
  onFocusModeChange: (enabled: boolean) => void;
  onRadiusChange: (value: number) => void;
  onSearch: (city: string) => void;
  fireSummary: FireSummary | null;
  loading: boolean;
  searchError: string | null;
  nearbyFiresCount: number;
  selectedFire: NearbyFire | null;
  onMobilePanelExpandedChange: (isExpanded: boolean) => void;
}

type RiskLevel = "Lower" | "Moderate" | "Elevated";

interface AreaInsight {
  score: number;
  level: RiskLevel;
  reasons: string[];
  actions: string[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function extractMostRecentYear(mostRecent: string): number | null {
  const match = mostRecent.match(/\((\d{4})\)\s*$/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function extractLargestAcres(largest: string): number {
  const match = largest.match(/\(([\d,]+)\s+acres\)\s*$/i);
  if (!match) return 0;
  const acres = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(acres) ? acres : 0;
}

function getAreaInsight(fireSummary: FireSummary, radiusMiles: number): AreaInsight {
  const countFactor = clamp01(fireSummary.count / 40);
  const acresFactor = clamp01(fireSummary.totalAcres / 300000);
  const largestAcres = extractLargestAcres(fireSummary.largest);
  const largestFactor = clamp01(largestAcres / 100000);

  const mostRecentYear = extractMostRecentYear(fireSummary.mostRecent);
  const currentYear = new Date().getFullYear();
  const yearsSinceRecent =
    typeof mostRecentYear === "number" ? Math.max(0, currentYear - mostRecentYear) : 25;
  const recencyFactor = clamp01((25 - yearsSinceRecent) / 25);

  const score = Math.round(
    countFactor * 45 + acresFactor * 30 + recencyFactor * 15 + largestFactor * 10
  );

  const level: RiskLevel =
    score >= 67 ? "Elevated" : score >= 34 ? "Moderate" : "Lower";

  const reasons = [
    `${fireSummary.count} mapped fire perimeters within ${radiusMiles} miles.`,
    `${Math.round(fireSummary.totalAcres).toLocaleString()} cumulative acres burned in this radius.`,
    `Most recent event: ${fireSummary.mostRecent}.`,
  ];

  const actions =
    level === "Elevated"
      ? [
          "Review evacuation routes and set a family communication plan.",
          "Harden defensible space around structures and clear ember-prone zones.",
          "Keep alerts enabled and monitor local incident updates in fire season.",
        ]
      : level === "Moderate"
        ? [
            "Refresh go-bags and verify local evacuation zones.",
            "Trim vegetation near structures before peak fire weather periods.",
            "Track seasonal outlooks and Red Flag warnings for your area.",
          ]
        : [
            "Maintain basic defensible space and annual home hardening checks.",
            "Keep an emergency plan and supplies updated once per season.",
            "Stay subscribed to local alerts as conditions can shift quickly.",
          ];

  return { score, level, reasons, actions };
}

function getRiskBadgeClasses(level: RiskLevel): string {
  if (level === "Elevated") {
    return "bg-rose-500/15 border-rose-300/35 text-rose-100";
  }
  if (level === "Moderate") {
    return "bg-amber-500/15 border-amber-300/35 text-amber-100";
  }
  return "bg-emerald-500/15 border-emerald-300/35 text-emerald-100";
}

export default function Sidebar({
  cityName,
  radiusMiles,
  isFocusModeEnabled,
  onFocusModeChange,
  onRadiusChange,
  onSearch,
  fireSummary,
  loading,
  searchError,
  nearbyFiresCount,
  selectedFire,
  onMobilePanelExpandedChange,
}: SidebarProps) {
  const [searchText, setSearchText] = useState("");
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isAreaInsightExpanded, setIsAreaInsightExpanded] = useState(false);
  const mobileScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const areaInsight = useMemo(
    () => (fireSummary ? getAreaInsight(fireSummary, radiusMiles) : null),
    [fireSummary, radiusMiles]
  );

  useEffect(() => {
    onMobilePanelExpandedChange(isMobileExpanded);
  }, [isMobileExpanded, onMobilePanelExpandedChange]);

  useEffect(() => {
    if (isMobileExpanded) return;
    if (!mobileScrollContainerRef.current) return;
    mobileScrollContainerRef.current.scrollTop = 0;
  }, [isMobileExpanded]);

  useEffect(() => {
    setIsAreaInsightExpanded(false);
  }, [cityName, radiusMiles]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(searchText);
    setIsMobileExpanded(true);
  };

  const panelContent = (
    <>
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
          className="rounded-lg bg-orange-600 hover:bg-orange-500 px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]"
        >
          Go
        </button>
      </form>
      {searchError && <p className="text-xs text-rose-200">{searchError}</p>}

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

      <label className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
        <div>
          <p className="text-xs font-medium text-white/90">Focus map on analysis area</p>
          <p className="text-[11px] text-white/55">
            Highlights fires within your current radius
          </p>
        </div>
        <input
          type="checkbox"
          checked={isFocusModeEnabled}
          onChange={(event) => onFocusModeChange(event.target.checked)}
          className="h-4 w-4 rounded accent-orange-500"
        />
      </label>

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

      {cityName && fireSummary && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">{cityName}</p>
          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              selectedFire?.fireName
                ? "max-h-8 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1"
            }`}
          >
            {selectedFire?.fireName && (
              <p className="text-xs text-white/60">
                Active fire: {selectedFire.fireName}
              </p>
            )}
          </div>

          <InsightCard
            cityName={cityName}
            radiusMiles={radiusMiles}
            fireSummary={fireSummary}
            selectedFire={selectedFire}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-xs text-white/50">Nearby Fires</p>
              <p className="text-lg font-semibold">
                <RollingNumber value={nearbyFiresCount} loading={loading} />
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-2">
              <p className="text-xs text-white/50">Total Acres</p>
              <p className="text-lg font-semibold">
                <RollingNumber
                  value={fireSummary.totalAcres}
                  loading={loading}
                  formatter={(input) => Math.round(input).toLocaleString()}
                />
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-2 col-span-2">
              <p className="text-xs text-white/50">Most Recent</p>
              <p className="text-sm font-medium truncate">
                <RollingMostRecent value={fireSummary.mostRecent} loading={loading} />
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-2 col-span-2">
              <p className="text-xs text-white/50">Largest Fire</p>
              <p className="text-sm font-medium truncate">
                <RollingLargestFire value={fireSummary.largest} loading={loading} />
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setIsAreaInsightExpanded((value) => !value)}
              className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <p className="text-sm font-medium">See more about this area</p>
                <p className="text-[11px] text-white/55">
                  Historical exposure score and suggested preparedness actions
                </p>
              </div>
              <svg
                viewBox="0 0 24 24"
                className={`h-4.5 w-4.5 transition-transform duration-300 ${
                  isAreaInsightExpanded ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isAreaInsightExpanded
                  ? "max-h-[460px] opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 -translate-y-1"
              }`}
            >
              {areaInsight && (
                <div className="px-3 pb-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white/60">Community Exposure Score</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getRiskBadgeClasses(
                        areaInsight.level
                      )}`}
                    >
                      {areaInsight.level}
                    </span>
                  </div>

                  <div className="rounded-md bg-white/[0.05] border border-white/10 px-2.5 py-2 flex items-end justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-white/55">Historical indicator</p>
                      <p className="text-lg font-semibold tabular-nums">
                        <RollingNumber value={areaInsight.score} loading={loading} />
                        <span className="text-xs text-white/60 font-normal"> / 100</span>
                      </p>
                    </div>
                    <p className="text-[11px] text-white/60 text-right max-w-[130px]">
                      Based on count, acres, recency, and largest event in radius.
                    </p>
                  </div>

                  <div className="space-y-1">
                    {areaInsight.reasons.map((reason) => (
                      <p key={reason} className="text-[11px] text-white/70 leading-relaxed">
                        {reason}
                      </p>
                    ))}
                  </div>

                  <div className="rounded-md bg-white/[0.03] border border-white/10 p-2">
                    <p className="text-[11px] font-medium text-white/75 mb-1">
                      Suggested next steps
                    </p>
                    <div className="space-y-1">
                      {areaInsight.actions.map((action) => (
                        <p key={action} className="text-[11px] text-white/65 leading-relaxed">
                          - {action}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              selectedFire
                ? "max-h-52 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1"
            }`}
          >
            {selectedFire && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1.5">
                <p className="text-xs tracking-wide text-white/55">
                  Details about this fire
                </p>
                <p className="text-sm font-semibold">{selectedFire.fireName}</p>
                <p className="text-xs text-white/70">
                  Year: {selectedFire.year ?? "Unknown"}
                </p>
                <p className="text-xs text-white/70">
                  Acres: {Math.round(selectedFire.acres).toLocaleString()}
                </p>
                <p className="text-xs text-white/70">
                  Cause: {selectedFire.causeLabel ?? "Unknown"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && cityName && !fireSummary && (
        <p className="text-xs text-white/50 text-center">
          No fires found within {radiusMiles} miles of {cityName}.
        </p>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hide-scrollbar hidden md:flex absolute top-4 left-4 z-10 w-72 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-black/60 backdrop-blur-sm text-white p-4 flex-col gap-4 shadow-lg border border-white/10">
        <div>
          {/* Link below is firexplorer text, clicking takes user back to home page*/}
          <Link href="/"
           type="button"
           className="font-coolvetica text-xl text-base font-semibold leading-tight text-[#f07012]">
            firexplorer
          </Link>
          <h1 className="text-base font-semibold leading-tight">
            California Wildfire Community Exposure Explorer
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Is your community at risk?
          </p>
        </div>
        {panelContent}
      </div>

      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close Firexplorer panel"
        onClick={() => setIsMobileExpanded(false)}
        className={`md:hidden fixed inset-0 z-20 bg-black/35 transition-opacity duration-300 ${
          isMobileExpanded
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile bottom sheet */}
      <div
        className={`md:hidden fixed inset-x-3 bottom-3 z-30 h-[min(82dvh,640px)] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md text-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isMobileExpanded
            ? "translate-y-0"
            : "translate-y-[calc(100%-78px)]"
        }`}
      >
        <div
          ref={mobileScrollContainerRef}
          className="h-full overflow-y-auto p-4 flex flex-col gap-4"
        >
          <button
            type="button"
            onClick={() => setIsMobileExpanded((value) => !value)}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 active:scale-[0.99] transition-transform"
          >
            <div className="text-left">
              <p className="text-sm font-medium">
                {cityName ?? "FireXplorer"}
              </p>
              <p className="text-xs text-white/60">
                {nearbyFiresCount} fires • {radiusMiles} mi radius
              </p>
            </div>
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition-transform duration-300 ${
                isMobileExpanded ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={`transition-opacity duration-200 ${
              isMobileExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {panelContent}
          </div>
        </div>
      </div>
    </>
  );
}