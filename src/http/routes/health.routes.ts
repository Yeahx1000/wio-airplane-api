import { FastifyInstance } from 'fastify';
import { pool } from '../../config/database.js';
import { redisClient } from '../../cache/index.js';

export const registerHealthRoutes = (fastify: FastifyInstance) => {
    fastify.get('/health', {
        schema: {
            tags: ['Health'],
            description: 'Health check endpoint',
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' },
                        database: { type: 'string' },
                        redis: { type: 'string' },
                    },
                },
                503: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        error: { type: 'string' },
                    },
                },
            },
        },
        handler: async (request, reply) => {
            const checks = {
                database: 'unknown',
                redis: 'unknown',
            };

            try {
                await pool.query('SELECT 1');
                checks.database = 'connected';
            } catch (error) {
                checks.database = 'disconnected';
                return reply.code(503).send({
                    status: 'unhealthy',
                    error: 'Database connection failed',
                });
            }

            try {
                await redisClient.ping();
                checks.redis = 'connected';
            } catch (error) {
                checks.redis = 'disconnected';
            }

            return reply.send({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                ...checks,
            });
        },
    });

    // Metrics endpoint (commented out - uncomment to enable metrics collection and expose endpoint)
    // fastify.get('/metrics', {
    //     schema: {
    //         tags: ['Health'],
    //         description: 'Get application metrics',
    //         response: {
    //             200: {
    //                 type: 'object',
    //                 properties: {
    //                     requests: {
    //                         type: 'array',
    //                         items: {
    //                             type: 'object',
    //                             properties: {
    //                                 endpoint: { type: 'string' },
    //                                 count: { type: 'number' },
    //                                 avgDuration: { type: 'number' },
    //                                 minDuration: { type: 'number' },
    //                                 maxDuration: { type: 'number' },
    //                             },
    //                         },
    //                     },
    //                     database: {
    //                         type: 'array',
    //                         items: {
    //                             type: 'object',
    //                             properties: {
    //                                 query: { type: 'string' },
    //                                 count: { type: 'number' },
    //                                 avgDuration: { type: 'number' },
    //                                 minDuration: { type: 'number' },
    //                                 maxDuration: { type: 'number' },
    //                             },
    //                         },
    //                     },
    //                     cache: {
    //                         type: 'object',
    //                         properties: {
    //                             hits: { type: 'number' },
    //                             misses: { type: 'number' },
    //                             hitRate: { type: 'number' },
    //                         },
    //                     },
    //                 },
    //             },
    //         },
    //     },
    //     handler: async (request, reply) => {
    //         const { getMetrics } = await import('../../observability/metrics.js');
    //         const metrics = getMetrics();
    //         return reply.send(metrics);
    //     },
    // });
};

