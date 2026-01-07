import { AirportRepository } from '../repositories/airport.repository.js';
import { redisClient } from '../cache/index.js';
import { cacheKeys } from '../cache/keys.js';
import { Airport, AirportWithDistance, CountryComparison } from '../models/airport.model.js';
import { recordCacheHit, recordCacheMiss } from '../observability/metrics.js';

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

    private async getOrSetCache<T>(
        cacheKey: string,
        fetchFn: () => Promise<T | null>,
        ttl: number,
        allowNull = false
    ): Promise<T | null> {
        const cached = await redisClient.getJSON<T>(cacheKey);
        if (cached) {
            recordCacheHit(cacheKey);
            return cached;
        }

        recordCacheMiss(cacheKey);
        const result = await fetchFn();
        if (result !== null || allowNull) {
            await redisClient.setJSON(cacheKey, result, ttl);
        }
        return result;
    }

    async findById(id: number): Promise<Airport | null> {
        return this.getOrSetCache(
            cacheKeys.airport(id),
            () => this.repository.findById(id),
            CACHE_TTL.AIRPORT
        );
    }

    async findByRadius(lat: number, lon: number, radiusKm: number): Promise<AirportWithDistance[]> {
        return this.getOrSetCache(
            cacheKeys.airportsInRadius(lat, lon, radiusKm),
            () => this.repository.findByRadius(lat, lon, radiusKm),
            CACHE_TTL.AIRPORTS_IN_RADIUS,
            true
        ) || [];
    }

    async findDistance(id1: number, id2: number): Promise<number | null> {
        return this.getOrSetCache(
            cacheKeys.airportDistance(id1, id2),
            () => this.repository.findDistance(id1, id2),
            CACHE_TTL.DISTANCE
        );
    }

    async findByCountry(country: string): Promise<Airport[]> {
        return this.getOrSetCache(
            cacheKeys.airportsByCountry(country),
            () => this.repository.findByCountry(country),
            CACHE_TTL.AIRPORTS_BY_COUNTRY,
            true
        ) || [];
    }

    async findAll(): Promise<Airport[]> {
        return await this.repository.findAll();
    }

    async findCountryComparison(country1: string, country2: string): Promise<CountryComparison | null> {
        return this.getOrSetCache(
            cacheKeys.countryComparison(country1, country2),
            () => this.repository.findClosestAirportsBetweenCountries(country1, country2),
            CACHE_TTL.COUNTRY_COMPARISON
        );
    }
}
