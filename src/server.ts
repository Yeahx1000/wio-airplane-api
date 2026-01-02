import Fastify from 'fastify';
import { configureApp } from './config/app.js';
import { registerRoutes } from './http/routes/index.js';
import { config } from './config/env.js';

const fastify = Fastify({
  logger: config.nodeEnv !== 'production',
});

configureApp(fastify);
registerRoutes(fastify);

fastify.listen({ port: config.server.port, host: config.server.host }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(`Server listening on ${config.server.host}:${config.server.port}`);
});
