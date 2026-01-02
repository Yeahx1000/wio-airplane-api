export const cacheKeys = {
  airport: (id: number) => `airport:${id}`,
  airportsInRadius: (lat: number, lon: number, radius: number) => `airports:radius:${lat}:${lon}:${radius}`,
  airportDistance: (id1: number, id2: number) => `distance:${id1}:${id2}`,
};

