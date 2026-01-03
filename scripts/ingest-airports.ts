import { createReadStream } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse';
import { initializeDatabase, pool, closeDatabase } from '../src/config/database.js';

// this script is used to insert the airports data into the database. 
// on setup, use 'npm run ingest' to run it.

interface AirportRow {
    ID: string;
    'Airport Name': string;
    City: string;
    Country: string;
    'IATA/FAA': string;
    ICAO: string;
    Latitude: string;
    Longitude: string;
    Altitude: string;
    Timezone: string;
}

const CSV_PATH = join(process.cwd(), 'data', 'api-developer-challenge-masterairport-data.csv');

const insertAirport = async (row: AirportRow) => {
    const id = parseInt(row.ID, 10);
    const latitude = parseFloat(row.Latitude);
    const longitude = parseFloat(row.Longitude);
    const altitude = parseInt(row.Altitude, 10);

    const iataFaa = row['IATA/FAA'].trim() || null;
    const icao = row.ICAO.trim() || null;

    const query = `
        INSERT INTO airports (id, airport_name, city, country, iata_faa, icao, latitude, longitude, altitude, timezone, location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ST_SetSRID(ST_MakePoint($8, $7), 4326))
        ON CONFLICT (id) DO UPDATE SET
            airport_name = EXCLUDED.airport_name,
            city = EXCLUDED.city,
            country = EXCLUDED.country,
            iata_faa = EXCLUDED.iata_faa,
            icao = EXCLUDED.icao,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            altitude = EXCLUDED.altitude,
            timezone = EXCLUDED.timezone,
            location = EXCLUDED.location
    `;

    await pool.query(query, [
        id,
        row['Airport Name'],
        row.City,
        row.Country,
        iataFaa,
        icao,
        latitude,
        longitude,
        altitude,
        row.Timezone,
    ]);
};

/*
    - Initialize DB.
    - Reads & parse CSV of airports into records.
    - Process in batches of 100, inserting each using insertAirport.
    - Log progress every 1000 inserts, and at the end.
    - Prints final count of airports in the DB.
    - Error handling (logs & exits)
*/
const ingestAirports = async () => {
    try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized.');

        console.log('Starting CSV ingestion...');
        const records: AirportRow[] = [];

        const parser = createReadStream(CSV_PATH)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }));

        for await (const record of parser) {
            records.push(record as AirportRow);
        }

        console.log(`Parsed ${records.length} records. Starting batch insert...`);

        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            await Promise.all(batch.map(row => insertAirport(row)));

            if ((i + batchSize) % 1000 === 0 || i + batchSize >= records.length) {
                console.log(`Inserted ${Math.min(i + batchSize, records.length)}/${records.length} records...`);
            }
        }

        console.log('Ingestion completed successfully!');

        const result = await pool.query('SELECT COUNT(*) as count FROM airports');
        console.log(`Total airports in database: ${result.rows[0].count}`);
    } catch (error) {
        console.error('Ingestion failed:', error);
        process.exit(1);
    } finally {
        await closeDatabase();
    }
};

ingestAirports();

