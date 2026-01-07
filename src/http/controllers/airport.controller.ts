import { FastifyRequest, FastifyReply } from 'fastify';
import { AirportService } from '../../services/airport.service.js';
import { RouteService } from '../../services/route.service.js';
import { AppError } from '../../errors/app-error.js';
import { ErrorCodes } from '../../errors/error-codes.js';

interface AirportByIdParams {
    id: number;
}

interface RadiusQuery {
    lat: number;
    lon: number;
    radius: number;
}

interface DistanceQuery {
    id1: number;
    id2: number;
}

interface CountryComparisonQuery {
    country1: string;
    country2: string;
}

interface RouteQuery {
    fromId: number;
    toId: number;
}

export class AirportController {
    constructor(
        private readonly airportService: AirportService,
        private readonly routeService: RouteService
    ) { }

    async getAirportById(
        req: FastifyRequest<{ Params: AirportByIdParams }>,
        res: FastifyReply
    ) {
        const { id } = req.params;

        const airport = await this.airportService.findById(id);
        if (!airport) {
            throw new AppError(
                `Airport with id ${id} not found`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        return airport;
    }

    async getAirportsByRadius(
        req: FastifyRequest<{ Querystring: RadiusQuery }>,
        res: FastifyReply
    ) {
        const { lat, lon, radius } = req.query;

        return await this.airportService.findByRadius(lat, lon, radius);
    }

    async getDistance(
        req: FastifyRequest<{ Querystring: DistanceQuery }>,
        res: FastifyReply
    ) {
        const { id1, id2 } = req.query;

        const airport1 = await this.airportService.findById(id1);
        if (!airport1) {
            throw new AppError(
                `Airport with id ${id1} not found`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        const airport2 = await this.airportService.findById(id2);
        if (!airport2) {
            throw new AppError(
                `Airport with id ${id2} not found`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        const distance = await this.airportService.findDistance(id1, id2);
        if (distance === null) {
            throw new AppError(
                'Failed to calculate distance between airports',
                500,
                ErrorCodes.DATABASE_ERROR
            );
        }

        return { distance };
    }

    async getCountryComparison(
        req: FastifyRequest<{ Querystring: CountryComparisonQuery }>,
        res: FastifyReply
    ) {
        const { country1, country2 } = req.query;

        const comparison = await this.airportService.findCountryComparison(country1, country2);
        if (!comparison) {
            throw new AppError(
                `No airports found for comparison between ${country1} and ${country2}`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        return comparison;
    }

    async getRoute(
        req: FastifyRequest<{ Querystring: RouteQuery }>,
        res: FastifyReply
    ) {
        const { fromId, toId } = req.query;

        const fromAirport = await this.airportService.findById(fromId);
        if (!fromAirport) {
            throw new AppError(
                `Airport with id ${fromId} not found`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        const toAirport = await this.airportService.findById(toId);
        if (!toAirport) {
            throw new AppError(
                `Airport with id ${toId} not found`,
                404,
                ErrorCodes.AIRPORT_NOT_FOUND
            );
        }

        const route = await this.routeService.findRoute(fromId, toId);
        if (!route) {
            throw new AppError(
                `No route found between airports ${fromId} and ${toId}`,
                404,
                ErrorCodes.ROUTE_NOT_FOUND
            );
        }

        return route;
    }
}

