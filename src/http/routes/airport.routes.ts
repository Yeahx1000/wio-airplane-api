import { FastifyInstance } from 'fastify';
import { AirportRepository } from '../../repositories/airport.repository.js';
import { AirportService } from '../../services/airport.service.js';
import { RouteService } from '../../services/route.service.js';
import { AirportController } from '../controllers/airport.controller.js';
import {
    airportResponseSchema,
    airportsByRadiusResponseSchema,
    distanceResponseSchema,
    countryComparisonResponseSchema,
    routeResponseSchema,
} from '../../validation/airport.schemas.js';
import { zodToFastifySchema } from '../../validation/schema-converter.js';

export const registerAirportRoutes = (fastify: FastifyInstance) => {
    const repository = new AirportRepository();
    const airportService = new AirportService(repository);
    const routeService = new RouteService(repository);
    const controller = new AirportController(airportService, routeService);

    fastify.get('/airports/:id', {
        schema: {
            tags: ['Airports'],
            description: 'Get airport by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', minimum: 1 },
                },
                required: ['id'],
            },
            response: {
                200: zodToFastifySchema(airportResponseSchema),
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.getAirportById.bind(controller),
    });

    fastify.get('/airports/radius', {
        schema: {
            tags: ['Airports'],
            description: 'Get airports within a given radius of a coordinate',
            querystring: {
                type: 'object',
                properties: {
                    lat: { type: 'number', minimum: -90, maximum: 90 },
                    lon: { type: 'number', minimum: -180, maximum: 180 },
                    radius: { type: 'number', minimum: 0 },
                },
                required: ['lat', 'lon', 'radius'],
            },
            response: {
                200: zodToFastifySchema(airportsByRadiusResponseSchema),
            },
        },
        handler: controller.getAirportsByRadius.bind(controller),
    });

    fastify.get('/airports/distance', {
        schema: {
            tags: ['Airports'],
            description: 'Get distance between two airports in kilometers',
            querystring: {
                type: 'object',
                properties: {
                    id1: { type: 'integer', minimum: 1 },
                    id2: { type: 'integer', minimum: 1 },
                },
                required: ['id1', 'id2'],
            },
            response: {
                200: zodToFastifySchema(distanceResponseSchema),
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.getDistance.bind(controller),
    });

    fastify.get('/airports/countries', {
        schema: {
            tags: ['Airports'],
            description: 'Get the closest airports between two countries',
            querystring: {
                type: 'object',
                properties: {
                    country1: { type: 'string', minLength: 1 },
                    country2: { type: 'string', minLength: 1 },
                },
                required: ['country1', 'country2'],
            },
            response: {
                200: zodToFastifySchema(countryComparisonResponseSchema),
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.getCountryComparison.bind(controller),
    });

    fastify.get('/airports/route', {
        schema: {
            tags: ['Routes'],
            description: 'Get the shortest route between two airports (500 mile max leg distance)',
            querystring: {
                type: 'object',
                properties: {
                    fromId: { type: 'integer', minimum: 1 },
                    toId: { type: 'integer', minimum: 1 },
                },
                required: ['fromId', 'toId'],
            },
            response: {
                200: zodToFastifySchema(routeResponseSchema),
                404: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.getRoute.bind(controller),
    });
};
