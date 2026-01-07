import { FastifyRequest, FastifyReply } from "fastify";
import { login, refreshAccessToken } from "../../auth/cognito.js";
import { loginSchema, refreshTokenSchema } from "../../validation/auth.schemas.js";
import { unauthorizedResponse } from "../utils/error-responses.js";

export class AuthController {
    async login(req: FastifyRequest, res: FastifyReply) {
        const body = loginSchema.parse(req.body);

        try {
            const tokens = await login(body.usernameOrEmail, body.password);
            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                idToken: tokens.idToken,
            };
        } catch (error) {
            req.log?.warn({ err: error }, "Auth login failed");
            return unauthorizedResponse(res, "Invalid credentials");
        }
    }

    async refresh(req: FastifyRequest, res: FastifyReply) {
        const body = refreshTokenSchema.parse(req.body);

        try {
            const usernameOrEmail =
                typeof (req as any).user?.["cognito:username"] === "string"
                    ? (req as any).user["cognito:username"]
                    : typeof (req as any).user?.email === "string"
                        ? (req as any).user.email
                        : typeof (req as any).user?.sub === "string"
                            ? (req as any).user.sub
                            : undefined;

            if (!usernameOrEmail) {
                return unauthorizedResponse(res, "Not authenticated");
            }

            const tokens = await refreshAccessToken(usernameOrEmail, body.refreshToken);
            return {
                accessToken: tokens.accessToken,
                idToken: tokens.idToken,
            };
        } catch (error) {
            req.log?.warn({ err: error }, "Auth refresh failed");
            return unauthorizedResponse(res, "Invalid refresh token");
        }
    }

    async me(req: FastifyRequest, res: FastifyReply) {
        const user = (req as any).user as
            | {
                sub: string;
                email?: string;
                "cognito:username"?: string;
            }
            | undefined;

        if (!user) {
            return unauthorizedResponse(res, "Not authenticated");
        }

        return {
            userId: user.sub,
            email: user.email || undefined,
            username: user["cognito:username"] || undefined,
        };
    }
}
