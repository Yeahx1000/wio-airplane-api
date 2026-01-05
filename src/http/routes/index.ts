import { FastifyInstance } from 'fastify';
import { registerAirportRoutes } from './airport.routes.js';
import { registerAuthRoutes } from './auth.routes.js';
import { registerHealthRoutes } from './health.routes.js';

export const registerRoutes = (fastify: FastifyInstance) => {
  registerHealthRoutes(fastify);
  registerAuthRoutes(fastify);
  registerAirportRoutes(fastify);
};

