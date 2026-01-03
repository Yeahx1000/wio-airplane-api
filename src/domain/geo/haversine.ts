// using the haversine formula to calculate the distance between two points

const EARTH_RADIUS_KM = 6371;

export const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const differenceInLat = toRadians(lat2 - lat1);
  const differenceInLon = toRadians(lon2 - lon1);

  const haversineValue =
    Math.sin(differenceInLat / 2) * Math.sin(differenceInLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(differenceInLon / 2) *
    Math.sin(differenceInLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return EARTH_RADIUS_KM * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

