export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SelectedCity {
  name: string;
  coordinates: Coordinates;
}

export interface NearbyFire {
  objectId: number;
  fireName: string;
  year: number | null;
  acres: number;
}

export interface FireSummary {
  count: number;
  totalAcres: number;
  mostRecent: string;
  largest: string;
}

export interface FireAnalysisResult {
  fires: NearbyFire[];
  summary: FireSummary | null;
}

export interface SearchRequest {
  requestId: number;
  city: string;
}
