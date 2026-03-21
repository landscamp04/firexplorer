"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import LandingPage from "@/components/LandingPage";
import Sidebar from "@/components/Sidebar";
import type {
  FireAnalysisResult,
  NearbyFire,
  SearchRequest,
  SelectedCity,
} from "@/types";

const ArcGISMap = dynamic(() => import("@/components/ArcGISMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <p className="text-gray-500 text-sm">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [hasLaunchedMap, setHasLaunchedMap] = useState(false);
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [proximityRadius, setProximityRadius] = useState(10);
  const [nearbyFires, setNearbyFires] = useState<NearbyFire[]>([]);
  const [selectedFire, setSelectedFire] = useState<NearbyFire | null>(null);
  const [fireSummary, setFireSummary] =
    useState<FireAnalysisResult["summary"]>(null);
  const [loading, setLoading] = useState(false);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState(false);
  const [isFocusModeEnabled, setIsFocusModeEnabled] = useState(true);

  const handleSearch = useCallback((city: string) => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

    setSelectedCity(null);
    setSelectedFire(null);
    setNearbyFires([]);
    setLoading(true);
    setSearchError(null);
    setFireSummary(null);
    setSearchRequest({
      requestId: Date.now(),
      city: trimmedCity,
    });
  }, []);

  const handleSearchComplete = useCallback((resolvedCity: SelectedCity) => {
    setSelectedCity(resolvedCity);
    setSearchError(null);
  }, []);

  const handleFireAnalysis = useCallback((result: FireAnalysisResult) => {
    setNearbyFires(result.fires);
    setFireSummary(result.summary);
    setSelectedFire((previous) => {
      if (result.fires.length === 0) return null;
      if (previous) {
        const persisted = result.fires.find(
          (fire) => fire.objectId === previous.objectId
        );
        return persisted ?? null;
      }
      return null;
    });
    setLoading(false);
  }, []);

  const handleFireSelect = useCallback((fire: NearbyFire | null) => {
    setSelectedFire(fire);
  }, []);

  const handleSearchError = useCallback(() => {
    setLoading(false);
    setSearchError("Location not found. Try city + state, like Highland, CA.");
  }, []);

  const handleAnalysisStart = useCallback(() => {
    setLoading(true);
    setSearchError(null);
  }, []);

  const handleRadiusChange = useCallback(
    (value: number) => {
      setProximityRadius(value);
      if (selectedCity) {
        setLoading(true);
      }
    },
    [selectedCity]
  );

  const handleLaunchMap = useCallback(() => {
    setHasLaunchedMap(true);
  }, []);

  if (!hasLaunchedMap) {
    return <LandingPage onExplore={handleLaunchMap} />;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Sidebar
        cityName={selectedCity?.name ?? null}
        radiusMiles={proximityRadius}
        isFocusModeEnabled={isFocusModeEnabled}
        onFocusModeChange={setIsFocusModeEnabled}
        onRadiusChange={handleRadiusChange}
        onSearch={handleSearch}
        fireSummary={fireSummary}
        loading={loading}
        searchError={searchError}
        nearbyFiresCount={nearbyFires.length}
        selectedFire={selectedFire}
        onMobilePanelExpandedChange={setIsMobilePanelExpanded}
      />
      <ArcGISMap
        searchRequest={searchRequest}
        radiusMiles={proximityRadius}
        summary={fireSummary}
        cityName={selectedCity?.name ?? null}
        loading={loading}
        isFocusModeEnabled={isFocusModeEnabled}
        isMobilePanelExpanded={isMobilePanelExpanded}
        onAnalysisStart={handleAnalysisStart}
        onSearchComplete={handleSearchComplete}
        onFireSummary={handleFireAnalysis}
        onFireSelect={handleFireSelect}
        onSearchError={handleSearchError}
      />
    </main>
  );
}