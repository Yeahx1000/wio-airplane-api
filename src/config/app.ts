import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import { rateLimit } from '../http/middleware/rate-limit.js';
import { logger } from '../http/middleware/logger.js';
import { errorHandler } from '../http/middleware/error-handler.js';

export const configureApp = async (app: FastifyInstance) => {
    try {
        console.log('Setting error handler...');
        app.setErrorHandler(errorHandler);

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
                        url: process.env.NODE_ENV === 'production'
                            ? '/'
                            : 'http://localhost:3000',
                        description: process.env.NODE_ENV === 'production'
                            ? 'Production server'
                            : 'Development server',
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
            staticCSP: true,
            transformStaticCSP: (header) => header,
        });

        console.log('Registering compression...');
        await app.register(fastifyCompress, {
            global: true,
            encodings: ['gzip', 'deflate'],
            threshold: 1024,
        });

        console.log('Registering helmet...');
        await app.register(fastifyHelmet, {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "data:"],
                    connectSrc: ["'self'"],
                },
            },
        });

        console.log('Adding hooks...');
        app.addHook('onRequest', async (req: FastifyRequest, res: FastifyReply) => {
            req.startTime = Date.now();
            await rateLimit(req, res);
        });
        app.addHook('onResponse', logger);

        console.log('App configuration complete');
    } catch (error) {
        console.error('Error in configureApp:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw error;
    }
};