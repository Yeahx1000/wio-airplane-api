import Redis from 'ioredis';

export class RedisClient {
    private readonly client: Redis;
    private connectionAttempted = false;
    private isAvailable = false;
    private connectionFailed = false;

    constructor(private readonly config: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    }) {
        const host = this.parseHost(config.host);
        const port = config.port;

        this.client = new Redis({
            host,
            port,
            password: config.password,
            db: config.db,
            retryStrategy: (times) => {
                if (times > 3 || this.connectionFailed) {
                    return null;
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false,
            lazyConnect: true,
            connectTimeout: 5000,
        });

        this.client.on('error', (err) => {
            if (this.connectionFailed) {
                return;
            }
            if (this.connectionAttempted && !this.isAvailable) {
                this.connectionFailed = true;
            }
        });

        this.client.on('connect', () => {
            this.isAvailable = true;
            this.connectionFailed = false;
            console.log('Redis client connected');
        });

        this.client.on('ready', () => {
            this.isAvailable = true;
            this.connectionFailed = false;
            console.log('Redis client ready');
        });

        this.client.on('close', () => {
            if (this.connectionAttempted) {
                this.isAvailable = false;
            }
        });
    }

    private parseHost(host: string): string {
        if (host.includes(':')) {
            const [hostname] = host.split(':');
            return hostname;
        }
        return host;
    }

    async connect(): Promise<void> {
        if (this.connectionFailed) {
            return;
        }
        if (!this.connectionAttempted) {
            this.connectionAttempted = true;
            try {
                await this.client.connect();
            } catch (error) {
                this.connectionFailed = true;
            }
        }
    }

    async get(key: string): Promise<string | null> {
        if (this.connectionFailed) {
            return null;
        }
        try {
            await this.connect();
            if (!this.isAvailable) {
                return null;
            }
            return await this.client.get(key);
        } catch (error) {
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (this.connectionFailed) {
            return;
        }
        try {
            await this.connect();
            if (!this.isAvailable) {
                return;
            }
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            this.connectionFailed = true;
        }
    }

    async getJSON<T>(key: string): Promise<T | null> {
        const value = await this.get(key);
        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Redis JSON parse error for key ${key}:`, error);
            return null;
        }
    }

    async setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            await this.set(key, serialized, ttlSeconds);
        } catch (error) {
            console.error(`Redis JSON stringify error for key ${key}:`, error);
            throw error;
        }
    }

    async del(key: string): Promise<void> {
        if (this.connectionFailed) {
            return;
        }
        try {
            await this.connect();
            if (!this.isAvailable) {
                return;
            }
            await this.client.del(key);
        } catch (error) {
            this.connectionFailed = true;
        }
    }

    async exists(key: string): Promise<boolean> {
        if (this.connectionFailed) {
            return false;
        }
        try {
            await this.connect();
            if (!this.isAvailable) {
                return false;
            }
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            return false;
        }
    }

    async ping(): Promise<boolean> {
        if (this.connectionFailed) {
            return false;
        }
        try {
            await this.connect();
            if (!this.isAvailable) {
                return false;
            }
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            this.connectionFailed = true;
            return false;
        }
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    getClient(): Redis {
        return this.client;
    }
}

