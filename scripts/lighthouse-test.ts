#!/usr/bin/env bun

/**
 * Helper script to build and serve production for manual Lighthouse testing
 *
 * Usage:
 *   bun run scripts/lighthouse-test.ts [port]
 *
 * Default port: 3002
 *
 * This script:
 * 1. Builds the production bundle
 * 2. Starts the production server on specified port
 * 3. Provides instructions for running Lighthouse
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const port = process.argv[2] || '3002';

console.log('🔨 Building production bundle...\n');

try {
  await execAsync('bun run build');
  console.log('\n✅ Build completed successfully\n');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

console.log(`🚀 Starting production server on port ${port}...\n`);
console.log(`📊 Manual Lighthouse Testing Instructions:`);
console.log(`   1. Open http://localhost:${port} in Chrome`);
console.log(`   2. Open DevTools (F12)`);
console.log(`   3. Go to Lighthouse tab`);
console.log(`   4. Select "Performance" category`);
console.log(`   5. Choose "Desktop" or "Mobile" preset`);
console.log(`   6. Click "Analyze page load"`);
console.log(`\n   Expected scores:`);
console.log(`   - Desktop: Performance 100, FCP ~1.3s, LCP ~1.5s`);
console.log(`   - Mobile: Performance ≥87, FCP ~2.3s, LCP ~2.3s\n`);
console.log(`🛑 Press Ctrl+C to stop the server\n`);

// Start the production server
const serverProcess = exec(`bun run start -- -p ${port}`);

serverProcess.stdout?.on('data', data => {
  process.stdout.write(data);
});

serverProcess.stderr?.on('data', data => {
  process.stderr.write(data);
});

serverProcess.on('exit', code => {
  console.log(`\nServer exited with code ${code}`);
  process.exit(code || 0);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping server...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill();
  process.exit(0);
});
