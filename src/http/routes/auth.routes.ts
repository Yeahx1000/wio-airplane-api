import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import {
    loginSchema,
    refreshTokenSchema,
    tokenResponseSchema,
    userResponseSchema,
} from '../../validation/auth.schemas.js';
import { zodToFastifySchema } from '../../validation/schema-converter.js';

export const registerAuthRoutes = (fastify: FastifyInstance) => {
    const controller = new AuthController();

    fastify.post('/auth/login', {
        schema: {
            tags: ['Authentication'],
            description: 'Login with email and password',
            body: zodToFastifySchema(loginSchema),
            response: {
                200: zodToFastifySchema(tokenResponseSchema),
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.login.bind(controller),
    });

    fastify.post('/auth/refresh', {
        schema: {
            tags: ['Authentication'],
            description: 'Refresh access token using refresh token',
            body: zodToFastifySchema(refreshTokenSchema),
            response: {
                200: zodToFastifySchema(tokenResponseSchema),
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.refresh.bind(controller),
    });

    fastify.get('/auth/me', {
        // @ts-ignore - Fastify v5 typing issue
        preHandler: [authenticate],
        schema: {
            tags: ['Authentication'],
            description: 'Get current authenticated user',
            security: [{ bearerAuth: [] }],
            response: {
                200: zodToFastifySchema(userResponseSchema),
                401: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: controller.me.bind(controller),
    } as any);
};

