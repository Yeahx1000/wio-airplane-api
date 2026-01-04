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

const airportSchema = z.object({
    id: z.number().int(),
    airportName: z.string(),
    city: z.string(),
    country: z.string(),
    iataFaa: z.string().optional(),
    icao: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number(),
    timezone: z.string(),
});

const airportWithDistanceSchema = airportSchema.extend({
    distance: z.number().optional(),
});

export const airportResponseSchema = airportSchema;

export const airportsByRadiusResponseSchema = z.array(airportWithDistanceSchema);

export const distanceResponseSchema = z.object({
    distance: z.number(),
});

const countryComparisonAirportSchema = airportSchema;

export const countryComparisonResponseSchema = z.object({
    airport1: countryComparisonAirportSchema,
    airport2: countryComparisonAirportSchema,
    distance: z.number(),
});

const routeLegAirportSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    city: z.string(),
    country: z.string(),
});

const routeLegSchema = z.object({
    fromId: z.number().int(),
    toId: z.number().int(),
    fromAirport: routeLegAirportSchema,
    toAirport: routeLegAirportSchema,
    distance: z.number(),
});

export const routeResponseSchema = z.object({
    legs: z.array(routeLegSchema),
    totalDistance: z.number(),
    totalStops: z.number(),
});

