import { FastifyRequest, FastifyReply } from 'fastify';
import { login, refreshAccessToken } from '../../auth/cognito.js';
import { loginSchema, refreshTokenSchema } from '../../validation/auth.schemas.js';

export class AuthController {
    async login(req: FastifyRequest, res: FastifyReply) {
        const body = loginSchema.parse(req.body);

        try {
            const tokens = await login(body.usernameOrEmail, body.password);
            res.send({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                idToken: tokens.idToken,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            res.status(401).send({
                error: 'Unauthorized',
                message,
            });
        }
    }

    async refresh(req: FastifyRequest, res: FastifyReply) {
        const body = refreshTokenSchema.parse(req.body);

        try {
            const tokens = await refreshAccessToken(body.refreshToken);
            res.send({
                accessToken: tokens.accessToken,
                idToken: tokens.idToken,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Token refresh failed';
            res.status(401).send({
                error: 'Unauthorized',
                message,
            });
        }
    }

    async me(req: FastifyRequest, res: FastifyReply) {
        if (!req.user) {
            res.status(401).send({
                error: 'Unauthorized',
                message: 'Not authenticated',
            });
            return;
        }

        res.send({
            userId: req.user.sub,
            email: req.user.email || undefined,
            username: req.user['cognito:username'] || undefined,
        });
    }
}

