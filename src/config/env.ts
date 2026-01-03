import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

// not really 100% necessary, may not even use, but helps with type safety and validation

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().regex(/^\d+$/).transform(Number).default(3000),
    HOST: z.string().default('0.0.0.0'),

    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.string().regex(/^\d+$/).transform(Number).default(5432),
    DB_NAME: z.string().default('airports'),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string().default(''),
    DB_SSL: z.string().transform((val) => val === 'true').default(false),

    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.string().regex(/^\d+$/).transform(Number).default(0),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('Invalid environment variables:');
        parsed.error.issues.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }

    return parsed.data;
}

export const env = validateEnv();

export const config = {
    nodeEnv: env.NODE_ENV,
    server: {
        port: env.PORT,
        host: env.HOST,
    },
    database: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        ssl: env.DB_SSL,
    },
    redis: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD,
        db: env.REDIS_DB,
    },
};

