import { initializeDatabase, closeDatabase } from '../../src/config/database.js';
import { redisClient } from '../../src/cache/index.js';
import { AirportRepository } from '../../src/repositories/airport.repository.js';
import { cacheKeys } from '../../src/cache/keys.js';
import { milesToKilometers } from '../../src/domain/geo/units.js';

const MAX_LEG_DISTANCE_MILES = 500;
const MAX_LEG_DISTANCE_KM = milesToKilometers(MAX_LEG_DISTANCE_MILES);
const MAX_NEIGHBORS_PER_AIRPORT = 200;
const NEIGHBOR_CACHE_TTL = 86400 * 30;
const BATCH_SIZE = 50;

// this script is used to warm the cache for the first time, can be used to warm the cache after a new deployment, if not done, requests, particularly to `/airports/route` will be much slower at first.

async function warmNeighborCache() {
    try {
        await initializeDatabase();
        await redisClient.connect();

        const repository = new AirportRepository();
        const allAirports = await repository.findAll();

        console.log(`Warming neighbor cache for ${allAirports.length} airports...`);
        console.log(`Processing in batches of ${BATCH_SIZE}`);

        let processed = 0;
        let cached = 0;
        let skipped = 0;

        for (let i = 0; i < allAirports.length; i += BATCH_SIZE) {
            const batch = allAirports.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (airport) => {
                const cacheKey = cacheKeys.neighbors(airport.id);
                const existing = await redisClient.getJSON(cacheKey);

                if (existing) {
                    skipped++;
                    return;
                }

                try {
                    const airportsInRadius = await repository.findByRadius(
                        airport.latitude,
                        airport.longitude,
                        MAX_LEG_DISTANCE_KM,
                        MAX_NEIGHBORS_PER_AIRPORT
                    );

                    const neighbors = airportsInRadius
                        .filter(a => a.id !== airport.id)
                        .map(a => ({
                            id: a.id,
                            distance: a.distance || 0,
                        }));

                    await redisClient.setJSON(cacheKey, neighbors, NEIGHBOR_CACHE_TTL);
                    cached++;
                } catch (error) {
                    console.error(`Error processing airport ${airport.id}:`, error);
                }
            });

            await Promise.all(promises);
            processed += batch.length;

            if (processed % 100 === 0 || processed === allAirports.length) {
                console.log(`Progress: ${processed}/${allAirports.length} airports processed (${cached} cached, ${skipped} skipped)`);
            }
        }

        console.log(`\nCache warming complete!`);
        console.log(`Total: ${allAirports.length} airports`);
        console.log(`Cached: ${cached} neighbor lists`);
        console.log(`Skipped: ${skipped} (already cached)`);
        console.log(`New: ${cached} (newly cached)`);

        await closeDatabase();
        await redisClient.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Cache warming failed:', error);
        process.exit(1);
    }
}

warmNeighborCache();

