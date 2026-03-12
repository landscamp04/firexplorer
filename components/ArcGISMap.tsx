"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Graphic from "@arcgis/core/Graphic";
import type FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import type Point from "@arcgis/core/geometry/Point";
import type MapView from "@arcgis/core/views/MapView";
import type {
  FireAnalysisResult,
  NearbyFire,
  SearchRequest,
  SelectedCity,
} from "@/types";

const FIRE_LAYER_URL = process.env.NEXT_PUBLIC_FIRES_LAYER_URL;
const CITIES_LAYER_URL = process.env.NEXT_PUBLIC_CITIES_LAYER_URL;
const WORLD_GEOCODER_URL =
  "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
const FIRE_MIN_ACRES = Number(process.env.NEXT_PUBLIC_FIRE_MIN_ACRES ?? 450);
const FIRE_WHERE = `YEAR_ >= 2000 AND YEAR_ <= 2025 AND GIS_ACRES >= ${FIRE_MIN_ACRES}`;

interface ArcGISMapProps {
  searchRequest: SearchRequest | null;
  radiusMiles: number;
  onSearchComplete: (resolvedCity: SelectedCity) => void;
  onFireSummary: (result: FireAnalysisResult) => void;
  onSearchError: () => void;
}

export default function ArcGISMap({
  searchRequest,
  radiusMiles,
  onSearchComplete,
  onFireSummary,
  onSearchError,
}: ArcGISMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const fireLayerRef = useRef<FeatureLayer | null>(null);
  const selectedLocationRef = useRef<Point | null>(null);
  const activeSearchIdRef = useRef<number | null>(null);
  const searchGraphicRef = useRef<Graphic | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const queryFireSummary = useCallback(
    async (point: Point, miles: number) => {
      const fireLayer = fireLayerRef.current;
      if (!fireLayer) {
        onFireSummary({ fires: [], summary: null });
        return;
      }

      try {
        await fireLayer.load();

        const result = await fireLayer.queryFeatures({
          where: FIRE_WHERE,
          geometry: point,
          distance: miles,
          units: "miles",
          spatialRelationship: "intersects",
          returnGeometry: false,
          outFields: ["OBJECTID", "FIRE_NAME", "YEAR_", "GIS_ACRES"],
        });

        const features = result.features ?? [];
        if (features.length === 0) {
          onFireSummary({
            fires: [],
            summary: {
              count: 0,
              totalAcres: 0,
              mostRecent: "None in selected radius",
              largest: "None in selected radius",
            },
          });
          return;
        }

        const nearbyFires: NearbyFire[] = features.map((feature) => {
          const objectId = Number(feature.attributes?.OBJECTID ?? 0);
          const fireName = String(feature.attributes?.FIRE_NAME ?? "Unnamed fire");
          const yearRaw = Number(feature.attributes?.YEAR_);
          const acresRaw = Number(feature.attributes?.GIS_ACRES ?? 0);
          return {
            objectId,
            fireName,
            year: Number.isFinite(yearRaw) && yearRaw > 0 ? yearRaw : null,
            acres: Number.isFinite(acresRaw) ? acresRaw : 0,
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
        const largestName = String(
          largestFeature.attributes?.FIRE_NAME ?? "Unnamed fire"
        );
        const largestAcres = Number(largestFeature.attributes?.GIS_ACRES ?? 0);

        onFireSummary({
          fires: nearbyFires,
          summary: {
            count: features.length,
            totalAcres: Math.round(totalAcres),
            mostRecent:
              mostRecentYear > 0
                ? `${mostRecentName} (${mostRecentYear})`
                : mostRecentName,
            largest: `${largestName} (${Math.round(largestAcres).toLocaleString()} acres)`,
          },
        });
      } catch {
        onFireSummary({ fires: [], summary: null });
      }
    },
    [onFireSummary]
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

      // California bounding extent
      const californiaExtent = new Extent({
        xmin: -124.48,
        ymin: 32.53,
        xmax: -114.13,
        ymax: 42.01,
        spatialReference: { wkid: 4326 },
      });

      const map = new Map({
        basemap: "arcgis/terrain",
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
      });

      viewRef.current = view;
      setIsMapReady(true);
    };

    void initializeMap();

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const location = selectedLocationRef.current;
    if (!location) return;
    void queryFireSummary(location, radiusMiles);
  }, [queryFireSummary, radiusMiles]);

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
        const [locatorModule, graphicModule] = await Promise.all([
          import("@arcgis/core/rest/locator"),
          import("@arcgis/core/Graphic"),
        ]);

        const locator = locatorModule;
        const Graphic = graphicModule.default;

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

        searchGraphicRef.current = new Graphic({
          geometry: bestMatch.location,
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
      }
    };

    void runSearch();
  }, [
    isMapReady,
    onSearchComplete,
    onSearchError,
    queryFireSummary,
    radiusMiles,
    searchRequest,
  ]);

  return (
    <div
      ref={mapDivRef}
      style={{ height: "100vh", width: "100%" }}
    />
  );
}