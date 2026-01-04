import { FastifyInstance } from 'fastify';
import { registerAirportRoutes } from './airport.routes.js';
import { registerAuthRoutes } from './auth.routes.js';

export const registerRoutes = (fastify: FastifyInstance) => {
  registerAuthRoutes(fastify);
  registerAirportRoutes(fastify);
};

