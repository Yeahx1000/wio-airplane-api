export type RouteLeg = {
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

export type RouteResponse = {
  legs: RouteLeg[];
  totalDistance: number;
  totalStops: number;
}

