import Fastify from 'fastify';
import { configureApp } from './config/app.js';
import { registerRoutes } from './http/routes/index.js';
import { config } from './config/env.js';
import { redisClient } from './cache/index.js';
import { initializeDatabase } from './config/database.js';

const fastify = Fastify({
  logger: config.nodeEnv !== 'production',
});

async function start() {
  try {
    await initializeDatabase();

    try {
      const isRedisReady = await redisClient.ping();
      if (isRedisReady) {
        fastify.log.info('Redis connected successfully');
      } else {
        fastify.log.warn('Redis connection failed, continuing without cache');
      }
    } catch (error) {
      fastify.log.warn('Redis unavailable, continuing without cache');
    }

    await configureApp(fastify);
    registerRoutes(fastify);

    await fastify.listen({ port: config.server.port, host: config.server.host });
    fastify.log.info(`Server listening on ${config.server.host}:${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
