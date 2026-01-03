import Redis from 'ioredis';

export class RedisClient {
    private readonly client: Redis;

    constructor(private readonly config: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    }) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db,
        });
    }

    async get(key: string): Promise<string | null> {
        return await this.client.get(key);
    }

    async set(key: string, value: string, ex: number): Promise<void> {
        await this.client.set(key, value, 'EX', ex);
    }
}

