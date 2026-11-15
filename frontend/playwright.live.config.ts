import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests-live',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60_000,
    expect: { timeout: 15_000 },
    reporter: [['list'], ['html', { outputFolder: 'playwright-report-live', open: 'never' }]],
    outputDir: 'test-results-live',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://frontend:3000',
        trace: 'on',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
