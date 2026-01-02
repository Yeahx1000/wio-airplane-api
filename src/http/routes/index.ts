import { FastifyInstance } from 'fastify';
import { registerAirportRoutes } from './airport.routes.js';

export const registerRoutes = (fastify: FastifyInstance) => {
  registerAirportRoutes(fastify);
};

