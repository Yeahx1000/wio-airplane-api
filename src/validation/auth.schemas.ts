import { z } from 'zod';

export const loginSchema = z.object({
    usernameOrEmail: z.union([
        z.string().email(), // email
        z.string().min(1).max(128) // Or username 
    ]),
    password: z.string().min(8),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});

export const tokenResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    idToken: z.string().optional(),
});

export const userResponseSchema = z.object({
    userId: z.string(),
    email: z.string().optional(),
    username: z.string().optional(),
});

