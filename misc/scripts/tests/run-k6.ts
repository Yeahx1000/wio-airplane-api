import { config as dotenvConfig } from 'dotenv';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// K6 runs javascript code, not ts, so we need to use the dotenv config to load the environment variables. we can't use the env module because it's not available in the k6 runtime. this file is a wrapper around the k6 script to load the environment variables.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({ path: resolve(__dirname, '../../../.env') });

const testScript = process.argv[2];

if (!testScript) {
    console.error('Usage: tsx run-k6.ts <k6-script-path>');
    process.exit(1);
}

const envVars = {
    TEST_URL: process.env.TEST_URL || 'http://localhost:3000',
    TEST_USERNAME: process.env.TEST_USERNAME || '',
    TEST_PASSWORD: process.env.TEST_PASSWORD || '',
    TARGET_RPS: process.env.TARGET_RPS || '',
    DURATION: process.env.DURATION || '',
    RAMP_UP: process.env.RAMP_UP || '',
};

const envString = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

const scriptPath = resolve(__dirname, testScript);

try {
    execSync(`${envString} k6 run ${scriptPath}`, {
        stdio: 'inherit',
        cwd: __dirname,
    });
} catch (error) {
    process.exit(1);
}

