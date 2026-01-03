import { FastifyInstance } from 'fastify';
import { AirportRepository } from '../../repositories/airport.repository.js';
import { AirportService } from '../../services/airport.service.js';
import { RouteService } from '../../services/route.service.js';
import { AirportController } from '../controllers/airport.controller.js';
import {
    airportByIdParamsSchema,
    radiusQuerySchema,
    distanceQuerySchema,
    countryComparisonQuerySchema,
    routeQuerySchema,
} from '../../validation/airport.schemas.js';
import { zodToFastifySchema } from '../../validation/schema-converter.js';

export const registerAirportRoutes = (fastify: FastifyInstance) => {
    const repository = new AirportRepository();
    const airportService = new AirportService(repository);
    const routeService = new RouteService(repository);
    const controller = new AirportController(airportService, routeService);

    fastify.get('/airports/:id', {
        schema: {
            params: zodToFastifySchema(airportByIdParamsSchema),
        },
        handler: controller.getAirportById.bind(controller),
    });

    fastify.get('/airports/radius', {
        schema: {
            querystring: zodToFastifySchema(radiusQuerySchema),
        },
        handler: controller.getAirportsByRadius.bind(controller),
    });

    fastify.get('/airports/distance', {
        schema: {
            querystring: zodToFastifySchema(distanceQuerySchema),
        },
        handler: controller.getDistance.bind(controller),
    });

    fastify.get('/airports/countries', {
        schema: {
            querystring: zodToFastifySchema(countryComparisonQuerySchema),
        },
        handler: controller.getCountryComparison.bind(controller),
    });

    fastify.get('/airports/route', {
        schema: {
            querystring: zodToFastifySchema(routeQuerySchema),
        },
        handler: controller.getRoute.bind(controller),
    });
};
