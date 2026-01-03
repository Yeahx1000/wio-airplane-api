import { readFileSync } from 'fs';
import { config } from './env.js';
import { Pool } from 'pg';
import { join } from 'path';

const poolConfig = {
    ...config.database,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
};

console.log('Database connection config:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    password: poolConfig.password ? '***' : '(not set)',
    ssl: poolConfig.ssl,
});

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

