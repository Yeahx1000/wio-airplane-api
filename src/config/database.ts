import { readFileSync } from 'fs';
import { config } from './env.js';
import { Pool } from 'pg';
import { join } from 'path';

const poolConfig = {
    ...config.database,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    query_timeout: 30000,
    statement_timeout: 30000,
    max: 50,
    min: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        if (config.nodeEnv === 'production') {
            console.log('Skipping migrations in production (assuming schema already exists)');
            return;
        }

        const sql = readFileSync(
            join(process.cwd(), 'misc', 'data', 'migrations', 'create_airports_table.sql'),
            'utf8'
        );

        await pool.query(sql);
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
};

export const closeDatabase = async () => {
    await pool.end();
};

