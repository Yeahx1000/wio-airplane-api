import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// generated script for load test, using k6
// NOTE: Ensure RATE_LIMIT_PER_IP is set high enough in .env (default 100/60s is too low for load tests)

const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

const BASE_URL = __ENV.TEST_URL || 'http://localhost:3000';
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '500', 10);
const DURATION = __ENV.DURATION || '60s';
const RAMP_UP = __ENV.RAMP_UP || '10s';

const rampUpSeconds = parseInt(RAMP_UP) || 10;
const durationSeconds = parseInt(DURATION) || 60;
const totalTestSeconds = rampUpSeconds + durationSeconds;
const expectedRPSWithRampUp = (TARGET_RPS * durationSeconds) / totalTestSeconds;

export const options = {
    scenarios: {
        constant_arrival_rate: {
            executor: 'constant-arrival-rate',
            rate: TARGET_RPS,
            timeUnit: '1s',
            duration: DURATION,
            preAllocatedVUs: Math.floor(TARGET_RPS * 0.1),
            maxVUs: TARGET_RPS * 2,
            startTime: RAMP_UP,
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.05'],
        errors: ['rate<0.05'],
        http_reqs: [`rate>=${Math.floor(expectedRPSWithRampUp * 0.9)}`, `rate<=${TARGET_RPS * 1.1}`],
    },
};

let authToken = null;

export function setup() {
    const username = __ENV.TEST_USERNAME;
    const password = __ENV.TEST_PASSWORD;

    if (!username || !password) {
        console.log('No credentials provided, testing without authentication');
        return { token: null };
    }

    const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({
            usernameOrEmail: username,
            password: password,
        }),
        {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'Auth' },
        }
    );

    if (loginRes.status === 200) {
        const data = JSON.parse(loginRes.body);
        console.log('Authentication successful');
        return { token: data.accessToken };
    }

    console.log('Authentication failed, testing without auth token');
    return { token: null };
}

const endpoints = [
    { path: '/health', weight: 10, requiresAuth: false },
    { path: '/airports/1', weight: 25, requiresAuth: true },
    { path: '/airports/radius?lat=40.7128&lon=-74.0060&radius=100', weight: 25, requiresAuth: true },
    { path: '/airports/distance?id1=1&id2=2', weight: 15, requiresAuth: true },
    { path: '/airports/countries', weight: 10, requiresAuth: true, params: { country1: 'United States', country2: 'Canada' } },
    { path: '/airports/route?fromId=1&toId=2', weight: 15, requiresAuth: true },
];

const weightedEndpoints = [];
endpoints.forEach((endpoint) => {
    for (let i = 0; i < endpoint.weight; i++) {
        weightedEndpoints.push(endpoint);
    }
});

function getRandomEndpoint() {
    return weightedEndpoints[Math.floor(Math.random() * weightedEndpoints.length)];
}

export default function (data) {
    const endpoint = getRandomEndpoint();

    if (endpoint.requiresAuth && !data.token) {
        errorRate.add(1);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    if (data.token && endpoint.requiresAuth) {
        headers['Authorization'] = `Bearer ${data.token}`;
    }

    let url = `${BASE_URL}${endpoint.path}`;
    if (endpoint.params) {
        const params = Object.entries(endpoint.params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
        url = `${BASE_URL}${endpoint.path}?${params}`;
    }

    const res = http.get(url, { headers, tags: { endpoint: endpoint.path.split('?')[0] } });

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'status is not 429': (r) => r.status !== 429,
        'status is not 401': (r) => r.status !== 401,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'has response body': (r) => r.body && r.body.length > 0,
    });

    if (!success) {
        errorRate.add(1);
    }

    requestDuration.add(res.timings.duration);
}

export function handleSummary(data) {
    const summary = {
        testConfig: {
            baseUrl: BASE_URL,
            targetRPS: TARGET_RPS,
            duration: DURATION,
        },
        metrics: {
            http_reqs: data.metrics.http_reqs,
            http_req_duration: data.metrics.http_req_duration,
            http_req_failed: data.metrics.http_req_failed,
            errors: data.metrics.errors,
        },
        thresholds: data.root_group.checks || [],
    };

    const actualRPS = data.metrics.http_reqs.values.rate;
    const rampUpSeconds = parseInt(RAMP_UP) || 10;
    const durSeconds = parseInt(DURATION) || 60;
    const expectedRPS = (TARGET_RPS * durSeconds) / (rampUpSeconds + durSeconds);
    const targetMet = actualRPS >= expectedRPS * 0.9;

    const p95 = data.metrics.http_req_duration.values['p(95)'] || 0;
    const p99 = data.metrics.http_req_duration.values['p(99)'] || 0;

    const status200Count = data.root_group.checks?.find((c) => c.name === 'status is 200')?.passes || 0;
    const status429Count = data.root_group.checks?.find((c) => c.name === 'status is not 429')?.fails || 0;
    const totalRequests = data.metrics.http_reqs.values.count;

    console.log('\n=== Load Test Summary ===');
    console.log(`Target RPS (steady-state): ${TARGET_RPS}`);
    console.log(`Expected RPS (with ${rampUpSeconds}s ramp-up): ${expectedRPS.toFixed(2)}`);
    console.log(`Actual RPS: ${actualRPS.toFixed(2)}`);
    console.log(`Target Met: ${targetMet ? 'YES' : 'NO'}`);
    console.log(`P95 Latency: ${p95.toFixed(2)}ms`);
    console.log(`P99 Latency: ${p99.toFixed(2)}ms`);
    console.log(`Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
    console.log(`Successful (200): ${status200Count} (${((status200Count / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Rate Limited (429): ${status429Count} (${((status429Count / totalRequests) * 100).toFixed(2)}%)`);
    console.log(`\n💡 If seeing 429 errors, check your .env:`);
    console.log(`   RATE_LIMIT_GLOBAL_MAX should be >= ${Math.ceil(TARGET_RPS * 1.2)}`);
    console.log(`   RATE_LIMIT_PER_IP should be >= ${TARGET_RPS * durSeconds * 2}`);
    console.log('========================\n');

    return {
        stdout: JSON.stringify(summary, null, 2),
    };
}

