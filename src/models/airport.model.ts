export type Airport = {
  id: number;
  airportName: string;
  city: string;
  country: string;
  iataFaa?: string;
  icao?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
}

export type AirportWithDistance = Airport & {
  distance?: number;
}

export type CountryComparison = {
  airport1: Airport;
  airport2: Airport;
  distance: number;
}

