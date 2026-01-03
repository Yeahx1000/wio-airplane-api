import { z } from 'zod';

export const radiusQuerySchema = z.object({
    query: z.object({
        lat: z.number().min(-90).max(90),
        lon: z.number().min(-180).max(180),
        radius: z.number().min(0),
    }),
});

export const distanceParamsSchema = z.object({
    params: z.object({
        id1: z.string().min(1),
        id2: z.string().min(1),
    }),
});

export const countryComparisonQuerySchema = z.object({
    query: z.object({
        country: z.string().min(1),
    }),
});

export const routeParamsSchema = z.object({
    query: z.object({
        fromId: z.string().min(1),
        toId: z.string().min(1),
    }),
});

