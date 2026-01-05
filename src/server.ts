import Fastify from 'fastify';
import { configureApp } from './config/app.js';
import { registerRoutes } from './http/routes/index.js';
import { config } from './config/env.js';
import { redisClient } from './cache/index.js';
import { initializeDatabase } from './config/database.js';

const fastify = Fastify({
  logger: true,
  requestTimeout: 60000,
});

async function start() {
  try {
    console.log('Starting server...');
    await initializeDatabase();
    console.log('Database initialized');

    try {
      const isRedisReady = await redisClient.ping();
      if (isRedisReady) {
        console.log('Redis connected successfully');
      } else {
        console.warn('Redis connection failed, continuing without cache');
      }
    } catch (error) {
      console.warn(`Redis unavailable: ${error instanceof Error ? error.message : String(error)}, continuing without cache`);
    }

    console.log('Configuring app...');
    await configureApp(fastify);
    console.log('App configured');

    console.log('Registering routes...');
    registerRoutes(fastify);
    console.log('Routes registered');

    await fastify.listen({ port: config.server.port, host: config.server.host });
    console.log(`Server listening on ${config.server.host}:${config.server.port}`);
  } catch (err) {
    console.error('Server startup failed:', err);
    if (err instanceof Error) {
      console.error('Error stack:', err.stack);
    }
    process.exit(1);
  }
}

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down gracefully...`);
  try {
    await fastify.close();
    console.log('Server closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
