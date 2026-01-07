import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
    dotenvConfig();
}

// this is the schema for validating the .env variables, it's making sure all required vars are 1. present and 2. adhering to type.

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
    REDIS_TLS: z.string().transform((val) => val === 'true').default(false),

    RATE_LIMIT_ENABLED: z.string().transform((val) => val !== 'false').default(true),
    RATE_LIMIT_PER_IP: z.string().regex(/^\d+$/).transform(Number).default(100),
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(60000),
    RATE_LIMIT_GLOBAL_MAX: z.string().regex(/^\d+$/).transform(Number).default(800),
    RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default(1000),

    AWS_REGION: z.string().default('us-east-1'),
    COGNITO_USER_POOL_ID: z.string().min(1),
    COGNITO_CLIENT_ID: z.string().min(1),
    COGNITO_CLIENT_SECRET: z.string().optional(),

    TEST_URL: z.string().default('http://localhost:3000'),
    TEST_USERNAME: z.string(),
    TEST_PASSWORD: z.string(),
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
        tls: env.REDIS_TLS,
    },
    rateLimit: {
        enabled: env.RATE_LIMIT_ENABLED,
        perIp: env.RATE_LIMIT_PER_IP,
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        globalMax: env.RATE_LIMIT_GLOBAL_MAX,
        globalWindowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
    },
    cognito: {
        region: env.AWS_REGION,
        userPoolId: env.COGNITO_USER_POOL_ID,
        clientId: env.COGNITO_CLIENT_ID,
        clientSecret: env.COGNITO_CLIENT_SECRET,
    },
    test: {
        url: env.TEST_URL,
        username: env.TEST_USERNAME,
        password: env.TEST_PASSWORD,
    },
};

export const TEST_URL = env.TEST_URL;
export const TEST_USERNAME = env.TEST_USERNAME;
export const TEST_PASSWORD = env.TEST_PASSWORD;

