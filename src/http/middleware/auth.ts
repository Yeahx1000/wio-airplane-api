import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, CognitoPayload } from "../../auth/cognito.js";
import { unauthorizedResponse } from "../utils/error-responses.js";

declare module "fastify" {
    interface FastifyRequest {
        user?: CognitoPayload;
    }
}

function extractToken(req: FastifyRequest): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;

    const token = match[1].trim();
    return token.length ? token : null;
}

export const authenticate = async (req: FastifyRequest, res: FastifyReply): Promise<void> => {
    const token = extractToken(req);

    if (!token) {
        unauthorizedResponse(res, "Missing or invalid authorization header");
        return;
    }

    try {
        req.user = await verifyToken(token);
    } catch (error) {
        req.log?.warn({ err: error }, "Token verification failed");
        unauthorizedResponse(res, "Invalid token");
    }
};
