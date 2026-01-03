import { z } from 'zod';

export const airportByIdParamsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const radiusQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(0),
});

export const distanceQuerySchema = z.object({
    id1: z.coerce.number().int().positive(),
    id2: z.coerce.number().int().positive(),
});

export const countryComparisonQuerySchema = z.object({
    country1: z.string().min(1),
    country2: z.string().min(1),
});

export const routeQuerySchema = z.object({
    fromId: z.coerce.number().int().positive(),
    toId: z.coerce.number().int().positive(),
});

