import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, CognitoPayload } from '../../auth/cognito.js';

declare module 'fastify' {
    interface FastifyRequest {
        user?: CognitoPayload;
    }
}

function extractToken(req: FastifyRequest): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

export const authenticate = async (
    req: FastifyRequest,
    res: FastifyReply
): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
        res.status(401).send({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header',
        });
        return;
    }

    try {
        const payload = await verifyToken(token);
        req.user = payload;
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid token';
        res.status(401).send({
            error: 'Unauthorized',
            message,
        });
        return;
    }
};

