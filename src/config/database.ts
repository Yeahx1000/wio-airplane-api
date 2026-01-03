import { readFileSync } from 'fs';
import { config } from './env.js';
import { Pool } from 'pg';
import { join } from 'path';

export const pool = new Pool(config.database);

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

export const initializeDatabase = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        const sql = readFileSync(
            join(process.cwd(), 'data', 'migrations', 'create_airports_table.sql'),
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

