"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
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
  const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(null);
  const [proximityRadius, setProximityRadius] = useState(10);
  const [nearbyFires, setNearbyFires] = useState<NearbyFire[]>([]);
  const [selectedFire, setSelectedFire] = useState<NearbyFire | null>(null);
  const [fireSummary, setFireSummary] =
    useState<FireAnalysisResult["summary"]>(null);
  const [loading, setLoading] = useState(false);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

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
        if (persisted) return persisted;
      }
      return result.fires[0];
    });
    setLoading(false);
  }, []);

  const handleSearchError = useCallback(() => {
    setLoading(false);
    setSearchError("Location not found. Try city + state, like Highland, CA.");
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

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Sidebar
        cityName={selectedCity?.name ?? null}
        radiusMiles={proximityRadius}
        onRadiusChange={handleRadiusChange}
        onSearch={handleSearch}
        fireSummary={fireSummary}
        loading={loading}
        searchError={searchError}
        nearbyFiresCount={nearbyFires.length}
        selectedFireName={selectedFire?.fireName ?? null}
      />
      <ArcGISMap
        searchRequest={searchRequest}
        radiusMiles={proximityRadius}
        onSearchComplete={handleSearchComplete}
        onFireSummary={handleFireAnalysis}
        onSearchError={handleSearchError}
      />
    </main>
  );
}