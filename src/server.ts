import Fastify from 'fastify';
import { configureApp } from './config/app.js';
import { registerRoutes } from './http/routes/index.js';

const fastify = Fastify({
  logger: true,
});

configureApp(fastify);
registerRoutes(fastify);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

fastify.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
