import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyHelmet from '@fastify/helmet';
import { rateLimit } from '../http/middleware/rate-limit.js';
import { logger } from '../http/middleware/logger.js';
import { errorHandler } from '../http/middleware/error-handler.js';

export const configureApp = async (app: FastifyInstance) => {
    try {
        console.log('Setting error handler...');
        app.setErrorHandler(errorHandler);

        console.log('Registering helmet...');
        await app.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        });

        console.log('Adding hooks...');
        app.addHook('onRequest', async (req, res) => {
            req.startTime = Date.now();
            await rateLimit(req, res);
        });
        app.addHook('onResponse', logger);

        console.log('Registering swagger...');
        await app.register(fastifySwagger, {
            openapi: {
                openapi: '3.0.0',
                info: {
                    title: 'Airport API',
                    description: 'API for querying airport data and routes',
                    version: '1.0.0',
                },
                servers: [
                    {
                        url: 'http://localhost:3000',
                        description: 'Development server',
                    },
                ],
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
            },
        });

        console.log('Registering swagger UI...');
        await app.register(fastifySwaggerUi, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
            },
            uiHooks: {
                onRequest: function (request, reply, next) {
                    next();
                },
                preHandler: function (request, reply, next) {
                    next();
                },
            },
            staticCSP: true,
            transformStaticCSP: (header) => header,
        });
        console.log('App configuration complete');
    } catch (error) {
        console.error('Error in configureApp:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
};

