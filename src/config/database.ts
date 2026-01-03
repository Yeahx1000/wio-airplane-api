import { readFileSync } from 'fs';
import { config } from './env.js';
import { Pool } from 'pg';
import { join } from 'path';


export const initializeDatabase = async () => {
    const pool = new Pool(config.database);

    const sql = readFileSync(
        join(process.cwd(), 'data', 'migrations', 'create_airports_table.sql'),
        'utf8'
    );

    await pool.query(sql);

    return pool;
};

