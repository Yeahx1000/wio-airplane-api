import { config } from '../config/env.js';
import { RedisClient } from './redis.js';

export * from './redis.js';
export * from './keys.js';

export const redisClient = new RedisClient({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
});

