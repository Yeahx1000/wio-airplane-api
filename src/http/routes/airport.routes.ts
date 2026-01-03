import { FastifyInstance } from 'fastify';
import { AirportRepository } from '../../repositories/airport.repository.js';
import { AirportService } from '../../services/airport.service.js';
import { RouteService } from '../../services/route.service.js';
import { AirportController } from '../controllers/airport.controller.js';

export const registerAirportRoutes = (fastify: FastifyInstance) => {
    const repository = new AirportRepository();
    const airportService = new AirportService(repository);
    const routeService = new RouteService(repository);
    const controller = new AirportController(airportService, routeService);

    fastify.get('/airports/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', minimum: 1 },
                },
                required: ['id'],
            },
        },
        handler: controller.getAirportById.bind(controller),
    });

    fastify.get('/airports/radius', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    lat: { type: 'number', minimum: -90, maximum: 90 },
                    lon: { type: 'number', minimum: -180, maximum: 180 },
                    radius: { type: 'number', minimum: 0 },
                },
                required: ['lat', 'lon', 'radius'],
            },
        },
        handler: controller.getAirportsByRadius.bind(controller),
    });

    fastify.get('/airports/distance', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    id1: { type: 'integer', minimum: 1 },
                    id2: { type: 'integer', minimum: 1 },
                },
                required: ['id1', 'id2'],
            },
        },
        handler: controller.getDistance.bind(controller),
    });

    fastify.get('/airports/countries', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    country1: { type: 'string', minLength: 1 },
                    country2: { type: 'string', minLength: 1 },
                },
                required: ['country1', 'country2'],
            },
        },
        handler: controller.getCountryComparison.bind(controller),
    });

    fastify.get('/airports/route', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    fromId: { type: 'integer', minimum: 1 },
                    toId: { type: 'integer', minimum: 1 },
                },
                required: ['fromId', 'toId'],
            },
        },
        handler: controller.getRoute.bind(controller),
    });
};
