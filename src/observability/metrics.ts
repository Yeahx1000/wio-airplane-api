type MetricLabel = Record<string, string | number>;

type MetricValue = {
    count: number;
    sum: number;
    min: number;
    max: number;
}

class MetricsCollector {
    private requestMetrics: Map<string, MetricValue> = new Map();
    private databaseMetrics: Map<string, MetricValue> = new Map();
    private cacheHitCount: number = 0;
    private cacheMissCount: number = 0;

    recordRequest(method: string, path: string, duration: number) {
        const key = `${method} ${this.normalizePath(path)}`;
        const existing = this.requestMetrics.get(key) || { count: 0, sum: 0, min: Infinity, max: 0 };

        this.requestMetrics.set(key, {
            count: existing.count + 1,
            sum: existing.sum + duration,
            min: Math.min(existing.min, duration),
            max: Math.max(existing.max, duration),
        });
    }

    recordDatabaseQuery(query: string, duration: number) {
        const normalizedQuery = this.normalizeQuery(query);
        const existing = this.databaseMetrics.get(normalizedQuery) || { count: 0, sum: 0, min: Infinity, max: 0 };

        this.databaseMetrics.set(normalizedQuery, {
            count: existing.count + 1,
            sum: existing.sum + duration,
            min: Math.min(existing.min, duration),
            max: Math.max(existing.max, duration),
        });
    }

    recordCacheHit(key: string) {
        this.cacheHitCount++;
    }

    recordCacheMiss(key: string) {
        this.cacheMissCount++;
    }

    getMetrics() {
        const requestStats = Array.from(this.requestMetrics.entries()).map(([key, value]) => ({
            endpoint: key,
            count: value.count,
            avgDuration: value.sum / value.count,
            minDuration: value.min,
            maxDuration: value.max,
        }));

        const databaseStats = Array.from(this.databaseMetrics.entries()).map(([query, value]) => ({
            query,
            count: value.count,
            avgDuration: value.sum / value.count,
            minDuration: value.min,
            maxDuration: value.max,
        }));

        const cacheStats = {
            hits: this.cacheHitCount,
            misses: this.cacheMissCount,
            hitRate: this.cacheHitCount + this.cacheMissCount > 0
                ? (this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount)) * 100
                : 0,
        };

        return {
            requests: requestStats,
            database: databaseStats,
            cache: cacheStats,
        };
    }

    reset() {
        this.requestMetrics.clear();
        this.databaseMetrics.clear();
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
    }

    private normalizePath(path: string): string {
        return path.split('?')[0].replace(/\/\d+/g, '/:id').replace(/\/[a-f0-9-]+/g, '/:uuid');
    }

    private normalizeQuery(query: string): string {
        return query
            .replace(/\$(\d+)/g, '$?')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
}

export const metricsCollector = new MetricsCollector();

export const recordRequest = (method: string, path: string, duration: number) => {
    metricsCollector.recordRequest(method, path, duration);
};

export const recordDatabaseQuery = (query: string, duration: number) => {
    metricsCollector.recordDatabaseQuery(query, duration);
};

export const recordCacheHit = (key: string) => {
    metricsCollector.recordCacheHit(key);
};

export const recordCacheMiss = (key: string) => {
    metricsCollector.recordCacheMiss(key);
};

export const getMetrics = () => {
    return metricsCollector.getMetrics();
};
