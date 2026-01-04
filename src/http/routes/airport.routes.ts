import { FastifyInstance } from 'fastify';
import { AirportRepository } from '../../repositories/airport.repository.js';
import { AirportService } from '../../services/airport.service.js';
import { RouteService } from '../../services/route.service.js';
import { AirportController } from '../controllers/airport.controller.js';
import { authenticate } from '../middleware/auth.js';
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
        preHandler: [authenticate],
        schema: {
            tags: ['Airports'],
            description: 'Get airport by ID',
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', minimum: 1 },
                },
                required: ['id'],
                examples: [
                    { id: 1 }
                ]
            },
            response: {
                200: {
                    ...zodToFastifySchema(airportResponseSchema),
                    examples: [
                        {
                            id: 1,
                            airportName: 'John F Kennedy International Airport',
                            city: 'New York',
                            country: 'United States',
                            iataFaa: 'JFK',
                            icao: 'KJFK',
                            latitude: 40.639751,
                            longitude: -73.778925,
                            altitude: 13,
                            timezone: 'America/New_York'
                        }
                    ]
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
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
    } as any);

    fastify.get('/airports/radius', {
        // @ts-ignore - Fastify v5 typing issue
        preHandler: [authenticate],
        schema: {
            tags: ['Airports'],
            description: 'Get airports within a given radius of a coordinate',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    lat: { type: 'number', minimum: -90, maximum: 90 },
                    lon: { type: 'number', minimum: -180, maximum: 180 },
                    radius: { type: 'number', minimum: 0 },
                },
                required: ['lat', 'lon', 'radius'],
                examples: [
                    {
                        lat: 40.7128,
                        lon: -74.0060,
                        radius: 50
                    }
                ]
            },
            response: {
                200: {
                    ...zodToFastifySchema(airportsByRadiusResponseSchema),
                    examples: [
                        [
                            {
                                id: 1,
                                airportName: 'John F Kennedy International Airport',
                                city: 'New York',
                                country: 'United States',
                                iataFaa: 'JFK',
                                icao: 'KJFK',
                                latitude: 40.639751,
                                longitude: -73.778925,
                                altitude: 13,
                                timezone: 'America/New_York',
                                distance: 12.5
                            }
                        ]
                    ]
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.getAirportsByRadius.bind(controller),
    } as any);

    fastify.get('/airports/distance', {
        // @ts-ignore - Fastify v5 typing issue
        preHandler: [authenticate],
        schema: {
            tags: ['Airports'],
            description: 'Get distance between two airports in kilometers',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    id1: { type: 'integer', minimum: 1 },
                    id2: { type: 'integer', minimum: 1 },
                },
                required: ['id1', 'id2'],
                examples: [
                    {
                        id1: 1,
                        id2: 2
                    }
                ]
            },
            response: {
                200: {
                    ...zodToFastifySchema(distanceResponseSchema),
                    examples: [
                        {
                            distance: 5847.5
                        }
                    ]
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
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
    } as any);

    fastify.get('/airports/countries', {
        // @ts-ignore - Fastify v5 typing issue
        preHandler: [authenticate],
        schema: {
            tags: ['Airports'],
            description: 'Get the closest airports between two countries',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    country1: { type: 'string', minLength: 1 },
                    country2: { type: 'string', minLength: 1 },
                },
                required: ['country1', 'country2'],
                examples: [
                    {
                        country1: 'United States',
                        country2: 'United Kingdom'
                    }
                ]
            },
            response: {
                200: {
                    ...zodToFastifySchema(countryComparisonResponseSchema),
                    examples: [
                        {
                            airport1: {
                                id: 1,
                                airportName: 'John F Kennedy International Airport',
                                city: 'New York',
                                country: 'United States',
                                iataFaa: 'JFK',
                                icao: 'KJFK',
                                latitude: 40.639751,
                                longitude: -73.778925,
                                altitude: 13,
                                timezone: 'America/New_York'
                            },
                            airport2: {
                                id: 2,
                                airportName: 'London Heathrow Airport',
                                city: 'London',
                                country: 'United Kingdom',
                                iataFaa: 'LHR',
                                icao: 'EGLL',
                                latitude: 51.4700,
                                longitude: -0.4543,
                                altitude: 83,
                                timezone: 'Europe/London'
                            },
                            distance: 5847.5
                        }
                    ]
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
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
    } as any);

    fastify.get('/airports/route', {
        // @ts-ignore - Fastify v5 typing issue
        preHandler: [authenticate],
        schema: {
            tags: ['Routes'],
            description: 'Get the shortest route between two airports (500 mile max leg distance)',
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    fromId: { type: 'integer', minimum: 1 },
                    toId: { type: 'integer', minimum: 1 },
                },
                required: ['fromId', 'toId'],
                examples: [
                    {
                        fromId: 1,
                        toId: 2
                    }
                ]
            },
            response: {
                200: {
                    ...zodToFastifySchema(routeResponseSchema),
                    examples: [
                        {
                            legs: [
                                {
                                    fromId: 1,
                                    toId: 3,
                                    fromAirport: {
                                        id: 1,
                                        name: 'John F Kennedy International Airport',
                                        city: 'New York',
                                        country: 'United States'
                                    },
                                    toAirport: {
                                        id: 3,
                                        name: 'Chicago O\'Hare International Airport',
                                        city: 'Chicago',
                                        country: 'United States'
                                    },
                                    distance: 1200.5
                                },
                                {
                                    fromId: 3,
                                    toId: 2,
                                    fromAirport: {
                                        id: 3,
                                        name: 'Chicago O\'Hare International Airport',
                                        city: 'Chicago',
                                        country: 'United States'
                                    },
                                    toAirport: {
                                        id: 2,
                                        name: 'London Heathrow Airport',
                                        city: 'London',
                                        country: 'United Kingdom'
                                    },
                                    distance: 6500.2
                                }
                            ],
                            totalDistance: 7700.7,
                            totalStops: 1
                        }
                    ]
                },
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
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
    } as any);
};
