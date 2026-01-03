import { AirportRepository } from '../repositories/airport.repository.js';
import { redisClient } from '../cache/index.js';
import { cacheKeys } from '../cache/keys.js';
import { Airport, AirportWithDistance, CountryComparison } from '../models/airport.types.js';

const CACHE_TTL = {
    AIRPORT: 3600,
    AIRPORTS_IN_RADIUS: 1800,
    DISTANCE: 3600,
    AIRPORTS_BY_COUNTRY: 3600,
    COUNTRY_COMPARISON: 3600,
};

export class AirportService {
    constructor(
        private readonly repository: AirportRepository
    ) { }

    async findById(id: number): Promise<Airport | null> {
        const cacheKey = cacheKeys.airport(id);
        const cached = await redisClient.getJSON<Airport>(cacheKey);
        if (cached) {
            return cached;
        }

        const airport = await this.repository.findById(id);
        if (airport) {
            await redisClient.setJSON(cacheKey, airport, CACHE_TTL.AIRPORT);
        }
        return airport;
    }

    async findByRadius(lat: number, lon: number, radiusKm: number): Promise<AirportWithDistance[]> {
        const cacheKey = cacheKeys.airportsInRadius(lat, lon, radiusKm);
        const cached = await redisClient.getJSON<AirportWithDistance[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const airports = await this.repository.findByRadius(lat, lon, radiusKm);
        await redisClient.setJSON(cacheKey, airports, CACHE_TTL.AIRPORTS_IN_RADIUS);
        return airports;
    }

    async findDistance(id1: number, id2: number): Promise<number | null> {
        const cacheKey = cacheKeys.airportDistance(id1, id2);
        const cached = await redisClient.getJSON<number>(cacheKey);
        if (cached !== null) {
            return cached;
        }

        const distance = await this.repository.findDistance(id1, id2);
        if (distance !== null) {
            await redisClient.setJSON(cacheKey, distance, CACHE_TTL.DISTANCE);
        }
        return distance;
    }

    async findByCountry(country: string): Promise<Airport[]> {
        const cacheKey = cacheKeys.airportsByCountry(country);
        const cached = await redisClient.getJSON<Airport[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const airports = await this.repository.findByCountry(country);
        await redisClient.setJSON(cacheKey, airports, CACHE_TTL.AIRPORTS_BY_COUNTRY);
        return airports;
    }

    async findAll(): Promise<Airport[]> {
        return await this.repository.findAll();
    }

    async findCountryComparison(country1: string, country2: string): Promise<CountryComparison | null> {
        const cacheKey = cacheKeys.countryComparison(country1, country2);
        const cached = await redisClient.getJSON<CountryComparison>(cacheKey);
        if (cached) {
            return cached;
        }

        const airports1 = await this.repository.findByCountry(country1);
        const airports2 = await this.repository.findByCountry(country2);

        if (airports1.length === 0 || airports2.length === 0) {
            return null;
        }

        let minDistance = Infinity;
        let closestAirport1: Airport | null = null;
        let closestAirport2: Airport | null = null;

        for (const airport1 of airports1) {
            for (const airport2 of airports2) {
                const distance = await this.repository.findDistance(airport1.id, airport2.id);
                if (distance !== null && distance < minDistance) {
                    minDistance = distance;
                    closestAirport1 = airport1;
                    closestAirport2 = airport2;
                }
            }
        }

        if (closestAirport1 === null || closestAirport2 === null) {
            return null;
        }

        const result: CountryComparison = {
            airport1: closestAirport1,
            airport2: closestAirport2,
            distance: minDistance,
        };

        await redisClient.setJSON(cacheKey, result, CACHE_TTL.COUNTRY_COMPARISON);
        return result;
    }
}
