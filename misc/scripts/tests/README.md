# Load Testing Scripts

> [!NOTE]
This section was mostly auto generated with the LLM, load test for the API, to punch in 500 to 1000 RPS, and to see how it performs.

This directory contains k6 load testing scripts for verifying API performance.

## Prerequisites

Install k6:

- **macOS**: `brew install k6`
- **Linux**: Follow [k6 installation guide](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- **Windows**: Download from [k6 releases](https://github.com/grafana/k6/releases)

## Scripts

### `load-test.js`

Configurable load test script. Accepts environment variables:

- `TARGET_RPS`: Target requests per second (default: 500)
- `DURATION`: Test duration (default: 60s)
- `RAMP_UP`: Ramp-up duration (default: 10s)
- `TEST_URL`: Base URL (default: <http://localhost:3000>)
- `TEST_USERNAME`: Username for authentication
- `TEST_PASSWORD`: Password for authentication

### `load-test-500.js`

Pre-configured test targeting 500 requests per second.

### `load-test-1000.js`

Pre-configured test targeting 1000 requests per second.

## Usage

```bash
# Run 500 RPS test
k6 run load-test-500.js

# Run 1000 RPS test
k6 run load-test-1000.js

# Run custom test
TARGET_RPS=750 DURATION=120s k6 run load-test.js

# With authentication
TEST_USERNAME=user@example.com TEST_PASSWORD=password k6 run load-test-500.js
```

## Before Testing

1. Ensure server is running
2. **IMPORTANT**: Adjust rate limits in your `.env` file for load testing:
   - `RATE_LIMIT_GLOBAL_MAX=1200` (for 1000 RPS tests, default is 800)
   - `RATE_LIMIT_PER_IP=10000` (default is 100 per 60s - too low for load tests from single IP)
   - The per-IP limit is the bottleneck when testing from localhost (all requests from same IP)
3. Warm up cache: `npm run warm-cache`
4. Monitor server metrics at `/metrics` endpoint

> **Note**: The per-IP rate limit (default: 100 requests per 60 seconds) will cause 429 errors when testing at 500+ RPS from a single IP. Increase `RATE_LIMIT_PER_IP` significantly for load testing.

## Expected Results

For 500 RPS:

- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 5%
- Actual RPS ≥ 450

For 1000 RPS:

- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 5%
- Actual RPS ≥ 900
