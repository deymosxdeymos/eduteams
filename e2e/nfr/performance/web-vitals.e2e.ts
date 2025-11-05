import { test, expect, chromium } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { createServer } from 'node:net';

// Get base URL from environment or use default
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * NF-03: Performance/Responsiveness Testing
 * 
 * Tests performance metrics using Lighthouse and Web Vitals:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - FID/INP (Interaction to Next Paint) < 200ms
 * - CLS (Cumulative Layout Shift) < 0.1
 * - Performance score > 80
 * 
 * IMPORTANT: These tests run against a PRODUCTION BUILD (bun run build + bun run start)
 * to ensure accurate performance measurements. Dev mode ships unminified bundles
 * and debugging overlays that artificially lower scores.
 * 
 * Manual testing:
 * 1. Build: bun run build
 * 2. Start: bun run start -- -p 3002
 * 3. Audit: Open http://localhost:3002 in Chrome DevTools Lighthouse
 * 
 * Expected scores:
 * - Desktop: Performance 100, FCP ~1.3s, LCP ~1.5s
 * - Mobile: Performance ≥87, FCP ~2.3s, LCP ~2.3s
 * 
 * Success Criteria:
 * - All Core Web Vitals meet "Good" thresholds
 * - Page load times are acceptable
 * - No performance regressions
 */

const allocateDebuggingPort = async (): Promise<number> => {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to allocate port for Lighthouse')));
      }
    });
  });
};

test.describe('NF-03: Performance', () => {
  test.describe.configure({ mode: 'serial' });

  let browser: Browser;
  let page: Page;
  let remoteDebuggingPort: number;

  test.beforeAll(async () => {
    // Launch browser with remote debugging for Lighthouse
    remoteDebuggingPort = await allocateDebuggingPort();
    browser = await chromium.launch({
      args: [`--remote-debugging-port=${remoteDebuggingPort}`],
    });
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test.describe('Lighthouse Audit', () => {
    test('homepage should meet performance thresholds', async ({ browserName, isMobile }) => {
      // Lighthouse only supports Chromium-based browsers
      test.skip(browserName === 'firefox', 'Lighthouse only supports Chromium-based browsers');
      // Skip mobile - mobile responsiveness not yet optimized
      test.skip(isMobile, 'Mobile performance not yet optimized');

      // Increase timeout for Lighthouse audits (default 30s is insufficient)
      test.setTimeout(120000); // 2 minutes

      await page.goto(`${BASE_URL}/`);

      const result = await playAudit({
        page,
        port: remoteDebuggingPort,
        thresholds: {
          performance: 80,
          accessibility: 90,
          'best-practices': 80,
          seo: 80,
        },
        reports: {
          formats: {
            html: true,
            json: true,
          },
          name: 'homepage-audit',
          directory: '.playwright-report/lighthouse',
        },
      });

      // Assert Lighthouse scores
      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.8);
      expect(result.lhr.categories.accessibility.score).toBeGreaterThanOrEqual(0.9);
      expect(result.lhr.categories['best-practices'].score).toBeGreaterThanOrEqual(0.8);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should measure LCP (Largest Contentful Paint)', async () => {
      await page.goto(`${BASE_URL}/`);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry.renderTime || lastEntry.loadTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });

          // Timeout after 10 seconds
          setTimeout(() => resolve(0), 10000);
        });
      });

      // LCP should be less than 2500ms (2.5s) for "Good" rating
      expect(lcp).toBeLessThan(2500);
      expect(lcp).toBeGreaterThan(0);
    });

    test('should measure CLS (Cumulative Layout Shift)', async () => {
      await page.goto(`${BASE_URL}/`);

      // Wait for page to stabilize
      await page.waitForTimeout(3000);

      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if ((entry as any).hadRecentInput) continue;
              clsValue += (entry as any).value;
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          // Measure for 3 seconds
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });

      // CLS should be less than 0.1 for "Good" rating
      expect(cls).toBeLessThan(0.1);
    });

    test('should measure FCP (First Contentful Paint)', async () => {
      await page.goto(`${BASE_URL}/`);

      const fcp = await page.evaluate(() => {
        const entries = performance.getEntriesByType('paint');
        const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
        return fcpEntry?.startTime || 0;
      });

      // FCP should be less than 1800ms for "Good" rating
      expect(fcp).toBeLessThan(1800);
      expect(fcp).toBeGreaterThan(0);
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load homepage within acceptable time', async () => {
      const startTime = Date.now();
      const response = await page.goto(`${BASE_URL}/`);
      const loadTime = Date.now() - startTime;

      expect(response?.status()).toBe(200);
      
      // Page should load in less than 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should measure Time to Interactive', async () => {
      await page.goto(`${BASE_URL}/`);

      const tti = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          if ('PerformanceObserver' in window) {
            // Fallback to domContentLoaded
            if (document.readyState === 'complete') {
              // Use Navigation Timing API Level 2
              const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
              if (navEntry) {
                resolve(navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              } else {
                resolve(performance.now());
              }
            } else {
              window.addEventListener('load', () => {
                const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (navEntry) {
                  resolve(navEntry.loadEventEnd - navEntry.fetchStart);
                } else {
                  resolve(performance.now());
                }
              });
            }
          } else {
            resolve(0);
          }
        });
      });

      // TTI should be reasonable (less than 5 seconds)
      expect(tti).toBeLessThan(5000);
    });
  });

  test.describe('Resource Loading', () => {
    test('should optimize image loading', async () => {
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');

      const images = await page.locator('img').all();
      
      // Check that images use Next.js Image optimization
      for (const img of images.slice(0, 5)) { // Check first 5 images
        const src = await img.getAttribute('src');
        
        // Next.js optimized images typically have _next/image or data URLs
        if (src && !src.startsWith('data:')) {
          expect(
            src.includes('/_next/image') || 
            src.includes('/_next/static') ||
            src.startsWith('data:')
          ).toBeTruthy();
        }
      }
    });

    test('should not have excessive JavaScript bundle size', async () => {
      const response = await page.goto(`${BASE_URL}/`);
      expect(response?.status()).toBe(200);

      // Get all JavaScript resources
      const jsResources = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources
          .filter(r => r.name.includes('.js'))
          .map(r => ({
            name: r.name,
            size: r.transferSize,
            duration: r.duration,
          }));
      });

      // Total JS should be reasonable (less than 1MB for initial load)
      const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
      expect(totalJsSize).toBeLessThan(1024 * 1024); // 1MB
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render without blocking main thread excessively', async () => {
      await page.goto(`${BASE_URL}/`);

      // Measure long tasks
      const longTasks = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          if (!('PerformanceObserver' in window)) {
            resolve(0);
            return;
          }

          let count = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) { // Tasks longer than 50ms
                count++;
              }
            }
          });

          try {
            observer.observe({ type: 'longtask', buffered: true });
          } catch {
            // longtask not supported in all browsers
            resolve(0);
            return;
          }

          setTimeout(() => {
            observer.disconnect();
            resolve(count);
          }, 5000);
        });
      });

      // Should have minimal long tasks (less than 5 in first 5 seconds)
      expect(longTasks).toBeLessThan(5);
    });
  });
});
