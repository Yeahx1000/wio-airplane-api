export interface Airport {
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

export interface AirportWithDistance extends Airport {
  distance?: number;
}

