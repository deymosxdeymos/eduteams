import { execSync } from 'node:child_process';

/**
 * Global setup for Playwright tests
 * Builds the production bundle before running E2E tests
 */
export default async function globalSetup() {
  // Skip build if running against existing server
  if (process.env.REUSE_SERVER === '1') {
    console.log('Skipping build (REUSE_SERVER=1)');
    return;
  }

  // Skip build - using manually built production bundle
  console.log('Skipping build (using manual production build)...');
  return;

  console.log('Building production bundle for E2E tests...');

  try {
    execSync('bun run build', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('Production build completed successfully');
  } catch (error) {
    console.error('Failed to build production bundle:', error);
    throw error;
  }
}
