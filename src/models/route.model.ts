export interface RouteLeg {
  fromId: number;
  toId: number;
  fromAirport: {
    id: number;
    name: string;
    city: string;
    country: string;
  };
  toAirport: {
    id: number;
    name: string;
    city: string;
    country: string;
  };
  distance: number;
}

export interface RouteResponse {
  legs: RouteLeg[];
  totalDistance: number;
  totalStops: number;
}

