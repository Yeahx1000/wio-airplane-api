import { pool } from '../config/database.js';
import { Airport, AirportWithDistance } from '../models/airport.model.js';

// this "repository" is responsible for fetching airports from the database and returning them in the correct format, basically some pre-formed queries for the airport service. Seperated out for easy reuse and organization.

export class AirportRepository {
    async findById(id: number): Promise<Airport | null> {
        const result = await pool.query(
            `SELECT 
                id,
                airport_name as "airportName",
                city,
                country,
                iata_faa as "iataFaa",
                icao,
                latitude,
                longitude,
                altitude,
                timezone
            FROM airports
            WHERE id = $1`,
            [id]
        );

        return result.rows[0] || null;
    }

    async findByRadius(lat: number, lon: number, radiusKm: number): Promise<AirportWithDistance[]> {
        const point = `ST_MakePoint($1, $2)::geography`;
        const radiusMeters = radiusKm * 1000;

        const result = await pool.query(
            `SELECT 
                id,
                airport_name as "airportName",
                city,
                country,
                iata_faa as "iataFaa",
                icao,
                latitude,
                longitude,
                altitude,
                timezone,
                ST_Distance(location::geography, ${point}) / 1000.0 as distance
            FROM airports
            WHERE ST_DWithin(location::geography, ${point}, $3)
            ORDER BY distance ASC`,
            [lon, lat, radiusMeters]
        );

        return result.rows.map(row => ({
            ...row,
            distance: parseFloat(row.distance),
        }));
    }

    async findDistance(id1: number, id2: number): Promise<number | null> {
        const result = await pool.query(
            `SELECT 
                ST_Distance(a1.location::geography, a2.location::geography) / 1000.0 as distance
            FROM airports a1, airports a2
            WHERE a1.id = $1 AND a2.id = $2`,
            [id1, id2]
        );

        if (result.rows.length === 0) {
            return null;
        }

        return parseFloat(result.rows[0].distance);
    }

    async findByCountry(country: string): Promise<Airport[]> {
        const result = await pool.query(
            `SELECT 
                id,
                airport_name as "airportName",
                city,
                country,
                iata_faa as "iataFaa",
                icao,
                latitude,
                longitude,
                altitude,
                timezone
            FROM airports
            WHERE LOWER(country) = LOWER($1)
            ORDER BY airport_name ASC`,
            [country]
        );

        return result.rows;
    }

    async findAll(): Promise<Airport[]> {
        const result = await pool.query(
            `SELECT 
                id,
                airport_name as "airportName",
                city,
                country,
                iata_faa as "iataFaa",
                icao,
                latitude,
                longitude,
                altitude,
                timezone
            FROM airports
            ORDER BY id ASC`
        );

        return result.rows;
    }
}

