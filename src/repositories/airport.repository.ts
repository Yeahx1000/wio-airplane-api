import { pool } from '../config/database.js';
import { Airport, AirportWithDistance, CountryComparison } from '../models/airport.model.js';

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

    async findByRadius(lat: number, lon: number, radiusKm: number, limit?: number): Promise<AirportWithDistance[]> {
        const point = `ST_MakePoint($1, $2)::geography`;
        const radiusMeters = radiusKm * 1000;
        const limitClause = limit ? `LIMIT ${limit}` : '';

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
            ORDER BY distance ASC
            ${limitClause}`,
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

    async findClosestAirportsBetweenCountries(country1: string, country2: string): Promise<CountryComparison | null> {
        const result = await pool.query(
            `SELECT 
                a1.id as "airport1_id",
                a1.airport_name as "airport1_airportName",
                a1.city as "airport1_city",
                a1.country as "airport1_country",
                a1.iata_faa as "airport1_iataFaa",
                a1.icao as "airport1_icao",
                a1.latitude as "airport1_latitude",
                a1.longitude as "airport1_longitude",
                a1.altitude as "airport1_altitude",
                a1.timezone as "airport1_timezone",
                a2.id as "airport2_id",
                a2.airport_name as "airport2_airportName",
                a2.city as "airport2_city",
                a2.country as "airport2_country",
                a2.iata_faa as "airport2_iataFaa",
                a2.icao as "airport2_icao",
                a2.latitude as "airport2_latitude",
                a2.longitude as "airport2_longitude",
                a2.altitude as "airport2_altitude",
                a2.timezone as "airport2_timezone",
                ST_Distance(a1.location::geography, a2.location::geography) / 1000.0 as distance
            FROM airports a1
            CROSS JOIN airports a2
            WHERE LOWER(a1.country) = LOWER($1)
              AND LOWER(a2.country) = LOWER($2)
            ORDER BY distance ASC
            LIMIT 1`,
            [country1, country2]
        );

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            airport1: {
                id: row.airport1_id,
                airportName: row.airport1_airportName,
                city: row.airport1_city,
                country: row.airport1_country,
                iataFaa: row.airport1_iataFaa,
                icao: row.airport1_icao,
                latitude: parseFloat(row.airport1_latitude),
                longitude: parseFloat(row.airport1_longitude),
                altitude: parseInt(row.airport1_altitude),
                timezone: row.airport1_timezone,
            },
            airport2: {
                id: row.airport2_id,
                airportName: row.airport2_airportName,
                city: row.airport2_city,
                country: row.airport2_country,
                iataFaa: row.airport2_iataFaa,
                icao: row.airport2_icao,
                latitude: parseFloat(row.airport2_latitude),
                longitude: parseFloat(row.airport2_longitude),
                altitude: parseInt(row.airport2_altitude),
                timezone: row.airport2_timezone,
            },
            distance: parseFloat(row.distance),
        };
    }
}

