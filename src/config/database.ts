import { readFileSync } from 'fs';
import { config } from './env.js';
import { Pool, QueryResult } from 'pg';
import { join } from 'path';
import { recordDatabaseQuery } from '../observability/metrics.js';

const poolConfig = {
    ...config.database,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
    query_timeout: 30000,
    statement_timeout: 30000,
};

console.log('Database connection config:', {
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    password: poolConfig.password ? '***' : '(not set)',
    ssl: poolConfig.ssl,
});

const basePool = new Pool(poolConfig);

const originalQuery = basePool.query.bind(basePool);

basePool.query = async function (queryText: any, values?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    const queryString = typeof queryText === 'string' ? queryText : queryText.text;

    try {
        const result = await originalQuery(queryText, values);
        const duration = Date.now() - startTime;
        recordDatabaseQuery(queryString, duration);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        recordDatabaseQuery(queryString, duration);
        throw error;
    }
} as any;

export const pool = basePool;

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

