import { AirportRepository } from '../repositories/airport.repository.js';
import { redisClient } from '../cache/index.js';
import { cacheKeys } from '../cache/keys.js';
import { findShortestPathAsync } from '../domain/routing/bfs.js';
import { buildRoute } from '../domain/routing/path-builder.js';
import { milesToKilometers } from '../domain/geo/units.js';
import { RouteResponse, RouteLeg } from '../models/route.model.js';
import { Airport } from '../models/airport.model.js';

const MAX_LEG_DISTANCE_MILES = 500;
const MAX_LEG_DISTANCE_KM = milesToKilometers(MAX_LEG_DISTANCE_MILES);
const ROUTE_CACHE_TTL = 3600;

export class RouteService {
    constructor(
        private readonly repository: AirportRepository
    ) { }

    async findRoute(fromId: number, toId: number): Promise<RouteResponse | null> {
        if (fromId === toId) {
            return {
                legs: [],
                totalDistance: 0,
                totalStops: 0,
            };
        }

        const cacheKey = cacheKeys.route(fromId, toId);
        const cached = await redisClient.getJSON<RouteResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const path = await findShortestPathAsync(
            fromId,
            toId,
            MAX_LEG_DISTANCE_KM,
            (id: number) => this.getNeighbors(id)
        );

        if (path.length === 0) {
            return null;
        }

        const distances = await this.getDistancesForPath(path);
        const distanceMap = new Map<string, number>();
        for (let i = 0; i < path.length - 1; i++) {
            const key = `${path[i]}:${path[i + 1]}`;
            distanceMap.set(key, distances[i]);
        }

        const routeLegs = buildRoute(
            path,
            (from: number, to: number) => distanceMap.get(`${from}:${to}`) || 0
        );

        const airports = await this.getAirportsForPath(path);
        const airportMap = new Map(airports.map(a => [a.id, a]));

        const legs: RouteLeg[] = routeLegs.map(leg => ({
            fromId: leg.fromId,
            toId: leg.toId,
            fromAirport: {
                id: leg.fromId,
                name: airportMap.get(leg.fromId)?.airportName || '',
                city: airportMap.get(leg.fromId)?.city || '',
                country: airportMap.get(leg.fromId)?.country || '',
            },
            toAirport: {
                id: leg.toId,
                name: airportMap.get(leg.toId)?.airportName || '',
                city: airportMap.get(leg.toId)?.city || '',
                country: airportMap.get(leg.toId)?.country || '',
            },
            distance: leg.distance,
        }));

        const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
        const totalStops = legs.length - 1;

        const route: RouteResponse = {
            legs,
            totalDistance,
            totalStops,
        };

        await redisClient.setJSON(cacheKey, route, ROUTE_CACHE_TTL);
        return route;
    }

    private async getNeighbors(id: number): Promise<Array<{ id: number; distance: number }>> {
        const airport = await this.repository.findById(id);
        if (!airport) {
            return [];
        }

        const airportsInRadius = await this.repository.findByRadius(
            airport.latitude,
            airport.longitude,
            MAX_LEG_DISTANCE_KM
        );

        return airportsInRadius
            .filter(a => a.id !== id)
            .map(a => ({
                id: a.id,
                distance: a.distance || 0,
            }));
    }

    private async getDistancesForPath(path: number[]): Promise<number[]> {
        const distances: number[] = [];
        for (let i = 0; i < path.length - 1; i++) {
            const distance = await this.repository.findDistance(path[i], path[i + 1]);
            distances.push(distance || 0);
        }
        return distances;
    }

    private async getAirportsForPath(path: number[]): Promise<Airport[]> {
        const airports: Airport[] = [];
        for (const id of path) {
            const airport = await this.repository.findById(id);
            if (airport) {
                airports.push(airport);
            }
        }
        return airports;
    }
}
