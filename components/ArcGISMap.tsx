"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Point from "@arcgis/core/geometry/Point";
import type MapView from "@arcgis/core/views/MapView";
import type FeatureLayerView from "@arcgis/core/views/layers/FeatureLayerView";
import { FIRE_WHERE, getFireCauseLabel, queryFiresNearPoint } from "@/lib/arcgis";
import {
  RollingLargestFire,
  RollingMostRecent,
  RollingNumber,
} from "@/components/RollingMetric";
import type {
  FireAnalysisResult,
  FireSummary,
  NearbyFire,
  SearchRequest,
  SelectedCity,
} from "@/types";

const FIRE_LAYER_URL = process.env.NEXT_PUBLIC_FIRES_LAYER_URL;
const CITIES_LAYER_URL = process.env.NEXT_PUBLIC_CITIES_LAYER_URL;
const WORLD_GEOCODER_URL =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

interface ArcGISMapProps {
  searchRequest: SearchRequest | null;
  radiusMiles: number;
  summary: FireSummary | null;
  cityName: string | null;
  loading: boolean;
  isFocusModeEnabled: boolean;
  isMobilePanelExpanded: boolean;
  onAnalysisStart: () => void;
  onSearchComplete: (resolvedCity: SelectedCity) => void;
  onFireSummary: (result: FireAnalysisResult) => void;
  onFireSelect: (fire: NearbyFire | null) => void;
  onSearchError: () => void;
}

export default function ArcGISMap({
  searchRequest,
  radiusMiles,
  summary,
  cityName,
  loading,
  isFocusModeEnabled,
  isMobilePanelExpanded,
  onAnalysisStart,
  onSearchComplete,
  onFireSummary,
  onFireSelect,
  onSearchError,
}: ArcGISMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const fireLayerRef = useRef<FeatureLayer | null>(null);
  const fireLayerViewRef = useRef<FeatureLayerView | null>(null);
  const selectedLocationRef = useRef<Point | null>(null);
  const activeSearchIdRef = useRef<number | null>(null);
  const searchGraphicRef = useRef<Graphic | null>(null);
  const bufferGraphicRef = useRef<Graphic | null>(null);
  const panDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressPanUpdateRef = useRef(false);
  const hasUserPannedRef = useRef(false);
  const activePanRequestIdRef = useRef<number>(0);
  const onFireSelectRef = useRef(onFireSelect);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isPanModeActive, setIsPanModeActive] = useState(false);

  useEffect(() => {
    onFireSelectRef.current = onFireSelect;
  }, [onFireSelect]);

  const applyPopupDocking = useCallback((view: MapView) => {
    if (!view.popup) return;

    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const popupPosition: "top-center" | "top-right" = isMobileViewport
      ? "top-center"
      : "top-right";
    const safeAreaTopRaw = getComputedStyle(document.documentElement)
      .getPropertyValue("--safe-area-top")
      .trim();
    const safeAreaTop = Number.parseFloat(safeAreaTopRaw);
    const topInset = Number.isFinite(safeAreaTop) ? safeAreaTop : 0;
    const currentPadding = view.padding ?? {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    view.popup.dockEnabled = true;
    view.popup.dockOptions = {
      ...view.popup.dockOptions,
      breakpoint: false,
      buttonEnabled: true,
      position: popupPosition,
    };
    view.padding = {
      ...currentPadding,
      top: isMobileViewport ? Math.round(topInset + 12) : 12,
      left: isMobileViewport ? 8 : currentPadding.left,
      right: isMobileViewport ? 8 : currentPadding.right,
    };
  }, []);

  const queryFireSummary = useCallback(
    async (point: Point, miles: number) => {
      const fireLayer = fireLayerRef.current;
      const view = viewRef.current;
      const fireLayerView = fireLayerViewRef.current;

      if (fireLayerView) {
        if (isFocusModeEnabled) {
          fireLayerView.featureEffect = {
            filter: {
              geometry: point,
              distance: miles,
              units: "miles",
              spatialRelationship: "intersects",
            },
            includedEffect:
              "drop-shadow(0px, 0px, 10px, rgba(255, 128, 0, 0.35)) brightness(1.08) saturate(1.2)",
            excludedEffect: "grayscale(85%) opacity(22%) blur(0.8px)",
          };
        } else {
          fireLayerView.featureEffect = null;
        }
      }

      if (view) {
        try {
          const [
            geometryEngineModule,
            graphicModule,
            simpleFillSymbolModule,
            simpleLineSymbolModule,
            colorModule,
          ] = await Promise.all([
            import("@arcgis/core/geometry/geometryEngine"),
            import("@arcgis/core/Graphic"),
            import("@arcgis/core/symbols/SimpleFillSymbol"),
            import("@arcgis/core/symbols/SimpleLineSymbol"),
            import("@arcgis/core/Color"),
          ]);

          const Graphic = graphicModule.default;
          const SimpleFillSymbol = simpleFillSymbolModule.default;
          const SimpleLineSymbol = simpleLineSymbolModule.default;
          const Color = colorModule.default;
          const bufferGeometry = geometryEngineModule.geodesicBuffer(
            point,
            miles,
            "miles"
          );
          const buffer = Array.isArray(bufferGeometry)
            ? bufferGeometry[0]
            : bufferGeometry;

          if (bufferGraphicRef.current) {
            view.graphics.remove(bufferGraphicRef.current);
          }

          if (buffer) {
            bufferGraphicRef.current = new Graphic({
              geometry: buffer,
              symbol: new SimpleFillSymbol({
                color: new Color([24, 24, 27, 0.04]),
                outline: new SimpleLineSymbol({
                  color: new Color([24, 24, 27, 0.92]),
                  width: 1.8,
                }),
              }),
            });
            view.graphics.add(bufferGraphicRef.current);
          }
        } catch {
          // Keep analysis functional even if buffer drawing fails.
        }
      }

      if (!fireLayer) {
        onFireSummary({ fires: [], summary: null });
        return;
      }

      try {
        const result = await queryFiresNearPoint(point, miles, fireLayer, FIRE_WHERE);
        onFireSummary(result);
      } catch {
        onFireSummary({ fires: [], summary: null });
      }
    },
    [isFocusModeEnabled, onFireSummary]
  );

  const reverseGeocodePoint = useCallback(async (point: Point) => {
    const locator = await import("@arcgis/core/rest/locator");
    const response = await locator.locationToAddress(WORLD_GEOCODER_URL, {
      location: point,
    });

    const responseData = response as unknown as {
      address?: Record<string, unknown> | string;
    };
    const address =
      typeof responseData.address === "object" && responseData.address !== null
        ? responseData.address
        : undefined;
    const resolvedName =
      typeof address?.City === "string" && address.City.trim().length > 0
        ? address.City
        : typeof address?.Subregion === "string" &&
            address.Subregion.trim().length > 0
          ? address.Subregion
          : "Your Position";

    return {
      name: resolvedName,
      coordinates: {
        latitude: Number(point.latitude ?? point.y),
        longitude: Number(point.longitude ?? point.x),
      },
    } satisfies SelectedCity;
  }, []);

  const syncMarkerToPoint = useCallback(async (point: Point) => {
    const view = viewRef.current;
    if (!view) return;

    const graphicModule = await import("@arcgis/core/Graphic");
    const Graphic = graphicModule.default;

    if (searchGraphicRef.current) {
      view.graphics.remove(searchGraphicRef.current);
    }

    searchGraphicRef.current = new Graphic({
      geometry: point,
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [37, 99, 235, 0.95],
        size: 10,
        outline: {
          color: [255, 255, 255, 1],
          width: 1.5,
        },
      },
    });
    view.graphics.add(searchGraphicRef.current);
  }, []);

  const handlePanToUpdate = useCallback(
    async (center: Point) => {
      const requestId = Date.now();
      activePanRequestIdRef.current = requestId;

      onAnalysisStart();
      selectedLocationRef.current = center;

      try {
        const resolvedCity = await reverseGeocodePoint(center);
        if (activePanRequestIdRef.current !== requestId) return;

        await syncMarkerToPoint(center);
        onSearchComplete(resolvedCity);
        await queryFireSummary(center, radiusMiles);
      } catch {
        if (activePanRequestIdRef.current !== requestId) return;
        await queryFireSummary(center, radiusMiles);
      }
    },
    [
      onAnalysisStart,
      onSearchComplete,
      queryFireSummary,
      radiusMiles,
      reverseGeocodePoint,
      syncMarkerToPoint,
    ]
  );

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapDivRef.current) return;

      const [
        mapModule,
        mapViewModule,
        featureLayerModule,
        extentModule,
        colorModule,
        classBreaksRendererModule,
        simpleRendererModule,
        simpleFillSymbolModule,
        simpleLineSymbolModule,
        simpleMarkerSymbolModule,
        reactiveUtilsModule,
      ] = await Promise.all([
        import("@arcgis/core/Map"),
        import("@arcgis/core/views/MapView"),
        import("@arcgis/core/layers/FeatureLayer"),
        import("@arcgis/core/geometry/Extent"),
        import("@arcgis/core/Color"),
        import("@arcgis/core/renderers/ClassBreaksRenderer"),
        import("@arcgis/core/renderers/SimpleRenderer"),
        import("@arcgis/core/symbols/SimpleFillSymbol"),
        import("@arcgis/core/symbols/SimpleLineSymbol"),
        import("@arcgis/core/symbols/SimpleMarkerSymbol"),
        import("@arcgis/core/core/reactiveUtils"),
      ]);

      const Map = mapModule.default;
      const MapView = mapViewModule.default;
      const FeatureLayer = featureLayerModule.default;
      const Extent = extentModule.default;
      const Color = colorModule.default;
      const ClassBreaksRenderer = classBreaksRendererModule.default;
      const SimpleRenderer = simpleRendererModule.default;
      const SimpleFillSymbol = simpleFillSymbolModule.default;
      const SimpleLineSymbol = simpleLineSymbolModule.default;
      const SimpleMarkerSymbol = simpleMarkerSymbolModule.default;
      const reactiveUtils = reactiveUtilsModule;

      // California bounding extent
      const californiaExtent = new Extent({
        xmin: -124.48,
        ymin: 32.53,
        xmax: -114.13,
        ymax: 42.01,
        spatialReference: { wkid: 4326 },
      });

      const map = new Map({
        basemap: "topo-vector",
      });

      // Fire perimeters layer — graduated color by year
      if (FIRE_LAYER_URL) {
        const fireRenderer = new ClassBreaksRenderer({
          field: "YEAR_",
          classBreakInfos: [
            {
              minValue: 2000,
              maxValue: 2005,
              symbol: new SimpleFillSymbol({
                color: new Color([255, 245, 180, 0.6]),
                outline: new SimpleLineSymbol({
                  color: new Color([180, 120, 0, 0.4]),
                  width: 0.3,
                }),
              }),
              label: "2001–2005",
            },
            {
              minValue: 2006,
              maxValue: 2010,
              symbol: new SimpleFillSymbol({
                color: new Color([255, 200, 100, 0.6]),
                outline: new SimpleLineSymbol({
                  color: new Color([180, 120, 0, 0.4]),
                  width: 0.3,
                }),
              }),
              label: "2006–2010",
            },
            {
              minValue: 2011,
              maxValue: 2015,
              symbol: new SimpleFillSymbol({
                color: new Color([240, 140, 50, 0.6]),
                outline: new SimpleLineSymbol({
                  color: new Color([180, 80, 0, 0.4]),
                  width: 0.3,
                }),
              }),
              label: "2011–2015",
            },
            {
              minValue: 2016,
              maxValue: 2020,
              symbol: new SimpleFillSymbol({
                color: new Color([210, 70, 30, 0.65]),
                outline: new SimpleLineSymbol({
                  color: new Color([150, 40, 0, 0.4]),
                  width: 0.3,
                }),
              }),
              label: "2016–2020",
            },
            {
              minValue: 2021,
              maxValue: 2025,
              symbol: new SimpleFillSymbol({
                color: new Color([160, 20, 20, 0.7]),
                outline: new SimpleLineSymbol({
                  color: new Color([100, 0, 0, 0.5]),
                  width: 0.3,
                }),
              }),
              label: "2021–2025",
            },
          ],
        });

        const fireLayer = new FeatureLayer({
          url: FIRE_LAYER_URL,
          title: "Wildfire Perimeters",
          definitionExpression: FIRE_WHERE,
          popupEnabled: false,
          renderer: fireRenderer,
          outFields: ["FIRE_NAME", "YEAR_", "GIS_ACRES", "CAUSE"],
          popupTemplate: {
            title: "{FIRE_NAME}",
            content: [
              {
                type: "fields",
                fieldInfos: [
                  { fieldName: "YEAR_", label: "Year" },
                  { fieldName: "GIS_ACRES", label: "Acres Burned", format: { digitSeparator: true, places: 0 } },
                  { fieldName: "CAUSE", label: "Cause" },
                ],
              },
            ],
          },
        });
        fireLayerRef.current = fireLayer;
        map.add(fireLayer);
      }

      // Cities layer — small dark points
      if (CITIES_LAYER_URL) {
        const cityRenderer = new SimpleRenderer({
          symbol: new SimpleMarkerSymbol({
            color: new Color([40, 40, 40, 0.8]),
            size: 4,
            outline: new SimpleLineSymbol({
              color: new Color([255, 255, 255, 0.6]),
              width: 0.5,
            }),
          }),
        });

        map.add(
          new FeatureLayer({
            url: CITIES_LAYER_URL,
            title: "Cities",
            renderer: cityRenderer,
            minScale: 2000000,
          })
        );
      }

      const view = new MapView({
        container: mapDivRef.current,
        map,
        extent: californiaExtent,
        constraints: {
          minZoom: 5,
        },
        popup: {
          dockEnabled: true,
          dockOptions: {
            breakpoint: false,
            buttonEnabled: true,
            position: "top-right",
          },
        },
      });

      applyPopupDocking(view);
      const handleResize = () => applyPopupDocking(view);
      window.addEventListener("resize", handleResize);

      const dragHandle = view.on("drag", () => {
        hasUserPannedRef.current = true;
        setIsPanModeActive(true);
        onFireSelectRef.current(null);
      });
      const centerHandle = reactiveUtils.watch(
        () => view.center,
        (center) => {
          if (!center || suppressPanUpdateRef.current || !hasUserPannedRef.current) {
            return;
          }

          const liveCenter = center.clone();
          selectedLocationRef.current = liveCenter;

          if (searchGraphicRef.current) {
            searchGraphicRef.current.geometry = liveCenter;
            return;
          }

          void syncMarkerToPoint(liveCenter);
        }
      );
      const stationaryHandle = reactiveUtils.watch(
        () => view.stationary,
        (stationary) => {
          if (!stationary || suppressPanUpdateRef.current || !hasUserPannedRef.current) {
            return;
          }

          const center = view.center?.clone();
          if (!center) return;

          if (panDebounceTimeoutRef.current) {
            clearTimeout(panDebounceTimeoutRef.current);
          }
          panDebounceTimeoutRef.current = setTimeout(() => {
            void handlePanToUpdate(center);
          }, 500);
        }
      );
      const popupVisibleHandle = reactiveUtils.watch(
        () => view.popup?.visible,
        (visible) => {
          if (visible) {
            hasUserPannedRef.current = false;
            setIsPanModeActive(false);
          }
        }
      );
      const clickHandle = view.on("click", async (event) => {
        const fireLayer = fireLayerRef.current;
        if (!fireLayer) return;

        const hitTestResult = await view.hitTest(event, {
          include: [fireLayer],
        });
        const hit = hitTestResult.results.find(
          (result) => result.type === "graphic"
        );

        if (!hit || hit.type !== "graphic") {
          return;
        }

        const attrs = hit.graphic.attributes as Record<string, unknown> | undefined;
        const objectIdRaw = Number(attrs?.OBJECTID ?? 0);
        const yearRaw = Number(attrs?.YEAR_);
        const acresRaw = Number(attrs?.GIS_ACRES ?? 0);
        const causeRaw = Number(attrs?.CAUSE);
        const causeCode = Number.isFinite(causeRaw) ? causeRaw : null;

        onFireSelectRef.current({
          objectId: Number.isFinite(objectIdRaw) ? objectIdRaw : 0,
          fireName: String(attrs?.FIRE_NAME ?? "Unnamed fire"),
          year: Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : null,
          acres: Number.isFinite(acresRaw) ? acresRaw : 0,
          causeCode,
          causeLabel: getFireCauseLabel(causeCode),
        });

        hasUserPannedRef.current = false;
        setIsPanModeActive(false);
      });

      viewRef.current = view;
      setIsMapReady(true);

      if (fireLayerRef.current) {
        const fireLayerView = (await view.whenLayerView(
          fireLayerRef.current
        )) as FeatureLayerView;
        fireLayerViewRef.current = fireLayerView;
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        dragHandle.remove();
        centerHandle.remove();
        stationaryHandle.remove();
        popupVisibleHandle.remove();
        clickHandle.remove();
      };
    };

    let removeResizeListener: (() => void) | undefined;
    void initializeMap().then((cleanup) => {
      removeResizeListener = cleanup;
    });

    return () => {
      if (removeResizeListener) {
        removeResizeListener();
      }
      if (panDebounceTimeoutRef.current) {
        clearTimeout(panDebounceTimeoutRef.current);
        panDebounceTimeoutRef.current = null;
      }
      if (viewRef.current) {
        if (fireLayerViewRef.current) {
          fireLayerViewRef.current.featureEffect = null;
          fireLayerViewRef.current = null;
        }
        if (bufferGraphicRef.current) {
          viewRef.current.graphics.remove(bufferGraphicRef.current);
          bufferGraphicRef.current = null;
        }
        viewRef.current.destroy();
        viewRef.current = null;
      }
      setIsMapReady(false);
    };
  }, [applyPopupDocking, handlePanToUpdate, syncMarkerToPoint]);

  useEffect(() => {
    const location = selectedLocationRef.current;
    const fireLayerView = fireLayerViewRef.current;

    if (!location) {
      if (fireLayerView) {
        fireLayerView.featureEffect = null;
      }
      return;
    }

    if (fireLayerView && !isFocusModeEnabled) {
      fireLayerView.featureEffect = null;
    }

    void queryFireSummary(location, radiusMiles);
  }, [isFocusModeEnabled, queryFireSummary, radiusMiles]);

  useEffect(() => {
    if (!searchRequest || !isMapReady || !viewRef.current) return;

    const runSearch = async () => {
      const view = viewRef.current;
      if (!view) {
        onSearchError();
        return;
      }

      const currentSearchId = searchRequest.requestId;
      activeSearchIdRef.current = currentSearchId;

      try {
        const locatorModule = await import("@arcgis/core/rest/locator");

        const locator = locatorModule;

        const primaryCandidates = await locator.addressToLocations(
          WORLD_GEOCODER_URL,
          {
            address: {
              SingleLine: `${searchRequest.city}, California`,
            },
            maxLocations: 1,
            outFields: ["City"],
          }
        );

        const fallbackCandidates =
          primaryCandidates.length > 0
            ? primaryCandidates
            : await locator.addressToLocations(
                WORLD_GEOCODER_URL,
                {
                  address: {
                    SingleLine: searchRequest.city,
                  },
                  maxLocations: 1,
                  outFields: ["City"],
                }
              );

        if (activeSearchIdRef.current !== currentSearchId) {
          return;
        }

        const bestMatch = fallbackCandidates[0];
        if (!bestMatch?.location) {
          onSearchError();
          return;
        }

        selectedLocationRef.current = bestMatch.location;
        suppressPanUpdateRef.current = true;
        setIsPanModeActive(false);
        onAnalysisStart();

        await view.goTo(
          {
            target: bestMatch.location,
            zoom: 10,
          },
          { duration: 1200 }
        );

        if (activeSearchIdRef.current !== currentSearchId) {
          return;
        }

        if (searchGraphicRef.current) {
          view.graphics.remove(searchGraphicRef.current);
        }
        await syncMarkerToPoint(bestMatch.location);

        const attributes = bestMatch.attributes as Record<string, unknown> | undefined;
        const matchedCity =
          typeof attributes?.City === "string" && attributes.City
            ? attributes.City
            : searchRequest.city;

        const resolvedCity: SelectedCity = {
          name: matchedCity,
          coordinates: {
            latitude: Number(bestMatch.location.latitude ?? bestMatch.location.y),
            longitude: Number(
              bestMatch.location.longitude ?? bestMatch.location.x
            ),
          },
        };

        onSearchComplete(resolvedCity);
        await queryFireSummary(bestMatch.location, radiusMiles);
      } catch {
        if (activeSearchIdRef.current === currentSearchId) {
          onSearchError();
        }
      } finally {
        suppressPanUpdateRef.current = false;
      }
    };

    void runSearch();
  }, [
    isMapReady,
    onSearchComplete,
    onFireSelect,
    onSearchError,
    onAnalysisStart,
    queryFireSummary,
    radiusMiles,
    searchRequest,
    syncMarkerToPoint,
  ]);

  useEffect(() => {
    if (!isMobilePanelExpanded) return;
    hasUserPannedRef.current = false;
    setIsPanModeActive(false);
  }, [isMobilePanelExpanded]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapDivRef}
        className="absolute inset-0"
      />

      <div
        className={`md:hidden pointer-events-none absolute right-3 z-[5] w-[min(232px,calc(100vw-24px))] rounded-xl border border-white/15 bg-black/55 backdrop-blur-sm p-3 text-white shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] transition-all duration-300 ${
          isPanModeActive ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
        }`}
        style={{ top: "calc(var(--safe-area-top) + 12px)" }}
      >
        <p className="text-[11px] uppercase tracking-wide text-white/65">
          Live Map Center
        </p>
        <p className="mt-0.5 text-sm font-medium truncate">
          {cityName ?? "Your Position"}
        </p>
        {summary ? (
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/70">Nearby Fires</span>
              <span className="font-medium">
                <RollingNumber value={summary.count} loading={loading} />
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/70">Total Acres</span>
              <span className="font-medium">
                <RollingNumber
                  value={summary.totalAcres}
                  loading={loading}
                  formatter={(input) => Math.round(input).toLocaleString()}
                />
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-white/70">Most Recent</span>
              <span className="max-w-[130px] text-right font-medium truncate tabular-nums">
                <RollingMostRecent value={summary.mostRecent} loading={loading} />
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-white/70">Largest Fire</span>
              <span className="max-w-[130px] text-right font-medium truncate tabular-nums">
                <RollingLargestFire value={summary.largest} loading={loading} />
              </span>
            </div>
            {loading && (
              <p className="pt-0.5 text-[11px] text-white/55">
                Updating wildfire stats...
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-white/70">
            Pan the map to fetch nearby wildfire details.
          </p>
        )}
      </div>
    </div>
  );
}