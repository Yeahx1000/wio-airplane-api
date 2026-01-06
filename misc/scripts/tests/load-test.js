import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// generated script for load test, using k6

const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

const BASE_URL = __ENV.TEST_URL || 'http://localhost:3000';
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '500', 10);
const DURATION = __ENV.DURATION || '60s';
const RAMP_UP = __ENV.RAMP_UP || '10s';

export const options = {
    stages: [
        { duration: RAMP_UP, target: Math.floor(TARGET_RPS * 0.2) },
        { duration: '10s', target: Math.floor(TARGET_RPS * 0.5) },
        { duration: '10s', target: TARGET_RPS },
        { duration: DURATION, target: TARGET_RPS },
        { duration: '10s', target: Math.floor(TARGET_RPS * 0.5) },
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.05'],
        errors: ['rate<0.05'],
        http_reqs: [`rate>=${TARGET_RPS * 0.9}`],
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
    { path: '/airports/1', weight: 30, requiresAuth: true },
    { path: '/airports/radius?lat=40.7128&lon=-74.0060&radius=100', weight: 30, requiresAuth: true },
    { path: '/airports/distance?id1=1&id2=2', weight: 20, requiresAuth: true },
    { path: '/airports/countries?country1=United States&country2=Canada', weight: 10, requiresAuth: true },
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

    const url = `${BASE_URL}${endpoint.path}`;
    const res = http.get(url, { headers, tags: { endpoint: endpoint.path.split('?')[0] } });

    const success = check(res, {
        'status is 200': (r) => r.status === 200,
        'status is not 429': (r) => r.status !== 429,
        'response time < 2000ms': (r) => r.timings.duration < 2000,
        'has response body': (r) => r.body && r.body.length > 0,
    });

    if (!success) {
        errorRate.add(1);
    }

    requestDuration.add(res.timings.duration);

    sleep(1 / TARGET_RPS);
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

    const actualRPS = data.metrics.http_reqs.values.count / (parseInt(DURATION) + 60);
    const targetMet = actualRPS >= TARGET_RPS * 0.9;

    console.log('\n=== Load Test Summary ===');
    console.log(`Target RPS: ${TARGET_RPS}`);
    console.log(`Actual RPS: ${actualRPS.toFixed(2)}`);
    console.log(`Target Met: ${targetMet ? 'YES' : 'NO'}`);
    console.log(`P95 Latency: ${data.metrics.http_req_duration.values['p(95)']}ms`);
    console.log(`P99 Latency: ${data.metrics.http_req_duration.values['p(99)']}ms`);
    console.log(`Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
    console.log('========================\n');

    return {
        stdout: JSON.stringify(summary, null, 2),
    };
}

