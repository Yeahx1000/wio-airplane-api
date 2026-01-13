import { AirportRepository } from '../repositories/airport.repository.js';
import { redisClient } from '../cache/index.js';
import { cacheKeys } from '../cache/keys.js';
import { findShortestPathAsync } from '../domain/routing/bfs.js';
import { buildRoute } from '../domain/routing/path-builder.js';
import { milesToKilometers } from '../domain/geo/units.js';
import { RouteResponse, RouteLeg } from '../models/route.model.js';
import { Airport } from '../models/airport.model.js';
import { recordCacheHit, recordCacheMiss } from '../observability/metrics.js';

const MAX_LEG_DISTANCE_MILES = 500;
const MAX_LEG_DISTANCE_KM = milesToKilometers(MAX_LEG_DISTANCE_MILES);
const ROUTE_CACHE_TTL = 3600;
const MAX_BFS_NODES = 10000;
const NEIGHBOR_CACHE_TTL = 86400 * 30;
const MAX_NEIGHBORS_PER_AIRPORT = 200;

type Neighbor = { id: number; distance: number };

export class RouteService {
    constructor(private readonly repository: AirportRepository) { }

    async findRoute(fromId: number, toId: number): Promise<RouteResponse | null> {
        if (fromId === toId) {
            return { legs: [], totalDistance: 0, totalStops: 0 };
        }

        const cacheKey = cacheKeys.route(fromId, toId);
        const cached = await redisClient.getJSON<RouteResponse>(cacheKey);
        if (cached !== null) {
            recordCacheHit(cacheKey);
            return cached;
        }

        recordCacheMiss(cacheKey);

        const path = await findShortestPathAsync(
            fromId,
            toId,
            MAX_LEG_DISTANCE_KM,
            (id: number) => this.getNeighbors(id),
            MAX_BFS_NODES
        );

        if (path.length === 0) return null;

        const [distanceMap, airports] = await Promise.all([
            this.getDistancesForPath(path),
            this.getAirportsForPath(path),
        ]);

        const routeLegs = buildRoute(path, (from: number, to: number) => {
            const distance = distanceMap.get(`${from}:${to}`);
            if (distance === undefined) {
                throw new Error(`Missing distance for leg ${from}:${to}`);
            }
            return distance;
        });

        const airportMap = new Map<number, Airport>(airports.map((a) => [a.id, a]));

        const legs: RouteLeg[] = routeLegs.map((leg) => {
            const fromAirport = airportMap.get(leg.fromId);
            const toAirport = airportMap.get(leg.toId);

            return {
                fromId: leg.fromId,
                toId: leg.toId,
                fromAirport: {
                    id: leg.fromId,
                    name: fromAirport?.airportName ?? "",
                    city: fromAirport?.city ?? "",
                    country: fromAirport?.country ?? "",
                },
                toAirport: {
                    id: leg.toId,
                    name: toAirport?.airportName ?? "",
                    city: toAirport?.city ?? "",
                    country: toAirport?.country ?? "",
                },
                distance: leg.distance,
            };
        });

        const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
        const totalStops = Math.max(0, legs.length - 1);

        const route: RouteResponse = { legs, totalDistance, totalStops };

        await redisClient.setJSON(cacheKey, route, ROUTE_CACHE_TTL);
        return route;
    }

    private async getNeighbors(id: number): Promise<Neighbor[]> {
        const cacheKey = cacheKeys.neighbors(id);
        const cached = await redisClient.getJSON<Neighbor[]>(cacheKey);
        if (cached !== null) {
            recordCacheHit(cacheKey);
            return cached;
        }

        recordCacheMiss(cacheKey);

        const airport = await this.repository.findById(id);
        if (!airport) return [];

        const airportsInRadius = await this.repository.findByRadius(
            airport.latitude,
            airport.longitude,
            MAX_LEG_DISTANCE_KM,
            MAX_NEIGHBORS_PER_AIRPORT
        );

        const neighbors: Neighbor[] = airportsInRadius
            .filter((airport) => airport.id !== id)
            .map((airport) => ({
                id: airport.id,
                distance: airport.distance ?? 0,
            }));

        await redisClient.setJSON(cacheKey, neighbors, NEIGHBOR_CACHE_TTL);
        return neighbors;
    }

    private async getDistancesForPath(path: number[]): Promise<Map<string, number>> {
        if (path.length < 2) return new Map();

        const pairs: Array<[number, number]> = [];
        for (let i = 0; i < path.length - 1; i++) {
            pairs.push([path[i], path[i + 1]]);
        }

        return this.repository.findDistancesBatch(pairs);
    }

    private async getAirportsForPath(path: number[]): Promise<Airport[]> {
        if (path.length === 0) return [];

        const results = await Promise.all(path.map((id) => this.repository.findById(id)));
        return results.filter((a): a is Airport => a !== null);
    }
}
