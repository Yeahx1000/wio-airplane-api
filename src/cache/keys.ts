export const cacheKeys = {
  airport: (id: number) => `airport:${id}`,
  airportsInRadius: (lat: number, lon: number, radius: number) => `airports:radius:${lat}:${lon}:${radius}`,
  airportDistance: (id1: number, id2: number) => `distance:${id1}:${id2}`,
  airportsByCountry: (country: string) => `airports:country:${country.toLowerCase()}`,
  countryComparison: (country1: string, country2: string) => {
    const [c1, c2] = [country1.toLowerCase(), country2.toLowerCase()].sort();
    return `country:comparison:${c1}:${c2}`;
  },
  route: (fromId: number, toId: number) => {
    const [id1, id2] = [fromId, toId].sort((a, b) => a - b);
    return `route:${id1}:${id2}`;
  },
};

