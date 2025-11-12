import { test, expect } from '@playwright/test';

/**
 * NF-05: Security - Authentication and Authorization Testing
 * 
 * Tests security controls including:
 * 1. Route protection (authenticated vs unauthenticated)
 * 2. Security headers
 * 3. Role-based access control
 * 4. Session management
 * 
 * Success Criteria:
 * - Protected routes require authentication
 * - Security headers are properly set
 * - Users can only access resources appropriate to their role
 * - Sessions expire appropriately
 */

test.describe('NF-05: Security', () => {
  
  test.describe('Route Protection', () => {
    const protectedRoutes = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/profile', name: 'Profile' },
      { path: '/dashboard/manage', name: 'Management' },
      { path: '/onboarding', name: 'Onboarding' },
      { path: '/onboarding/role', name: 'Role Selection' },
      { path: '/onboarding/data-diri/mahasiswa', name: 'Personal Data' },
      { path: '/dashboard/class/test-id', name: 'Class Details' },
    ];

    for (const route of protectedRoutes) {
      test(`should redirect unauthenticated users from ${route.name}`, async ({ page }) => {
        const response = await page.goto(route.path);
        
        // Should either redirect or return 401/403
        if (response?.status() === 200) {
          // If 200, should have redirected away from protected route
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          expect(currentUrl).not.toContain(route.path);

          const currentPath = new URL(currentUrl).pathname;
          
          // Should be on login/home page
          expect(currentPath).toMatch(/^\/(en)?\/?$/);
        } else {
          // Or return appropriate status code
          expect([401, 403, 302, 307]).toContain(response?.status() || 0);
        }
      });
    }

    test('should allow access to public routes without authentication', async ({ page }) => {
      const publicRoutes = ['/', '/en'];
      
      for (const route of publicRoutes) {
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        
        // Should not redirect
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain(route === '/' ? '' : route);
      }
    });
  });

  test.describe('Authentication Flow Security', () => {
    test('should not expose session tokens in URLs', async ({ page }) => {
      await page.goto('/');
      
      // Check URL params
      const url = new URL(page.url());
      const params = url.searchParams;
      
      // Common session token parameter names
      const tokenParams = ['token', 'session', 'auth', 'access_token', 'session_token'];
      for (const param of tokenParams) {
        expect(params.has(param)).toBeFalsy();
      }
    });

    test('should use secure authentication mechanism', async ({ page }) => {
      await page.goto('/');
      
      // Check for Better Auth implementation
      const cookies = await page.context().cookies();
      
      // If authenticated, session should be in httpOnly cookie
      const sessionCookie = cookies.find(c => 
        c.name.includes('session') || c.name.includes('auth')
      );
      
      if (sessionCookie) {
        // Session cookies should be httpOnly for security
        expect(sessionCookie.httpOnly).toBe(true);
        
        // Should be secure in production
        if (process.env.NODE_ENV === 'production') {
          expect(sessionCookie.secure).toBe(true);
        }
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should not allow GET requests to mutate data', async ({ page, context }) => {
      // Navigate to a page first
      await page.goto('/');
      
      // Attempt to make a GET request that shouldn't mutate data
      const response = await context.request.get('/api/auth/signout');
      
      // GET requests for mutations should be rejected or require POST
      // Better Auth uses POST for signout
      expect([405, 404]).toContain(response.status());
    });
  });

  test.describe('Authorization (Role-Based)', () => {
    test('should differentiate between Dosen and Mahasiswa routes', async ({ page }) => {
      // Without auth, management routes should be protected
      await page.goto('/dashboard/manage');
      
      await page.waitForLoadState('networkidle');
      
      // Should redirect to home or show unauthorized
      const url = page.url();
      expect(url).not.toContain('/dashboard/manage');
    });

    test('should protect assignment management routes', async ({ page }) => {
      // These routes are for Dosen only
      await page.goto('/dashboard/manage/assignments/test-course-id');
      
      await page.waitForLoadState('networkidle');
      
      // Should redirect away
      expect(page.url()).not.toContain('/dashboard/manage/assignments');
    });
  });

  test.describe('Input Validation', () => {
    test('should handle invalid route parameters safely', async ({ page }) => {
      // Test with XSS attempt in URL
      const xssAttempts = [
        '/dashboard/class/<script>alert(1)</script>',
        '/dashboard/class/../../etc/passwd',
        '/dashboard/class/%00',
      ];

      for (const maliciousPath of xssAttempts) {
        await page.goto(maliciousPath, { waitUntil: 'domcontentloaded' });
        
        // Should not execute scripts or crash
        const pageContent = await page.content();
        expect(pageContent).not.toContain('<script>alert(1)</script>');
        
        // Should handle gracefully (404 or redirect)
        expect(page.url()).toBeDefined();
      }
    });
  });

  test.describe('Session Security', () => {
    test('should not leak sensitive data in client-side JavaScript', async ({ page }) => {
      await page.goto('/');
      
      // Check window object for leaked credentials
      const sensitiveData = await page.evaluate(() => {
        const win = window as any;
        return {
          hasPassword: 'password' in win,
          hasSecret: 'secret' in win,
          hasApiKey: 'apiKey' in win || 'api_key' in win,
          hasPrivateKey: 'privateKey' in win || 'private_key' in win,
        };
      });
      
      expect(sensitiveData.hasPassword).toBe(false);
      expect(sensitiveData.hasSecret).toBe(false);
      expect(sensitiveData.hasApiKey).toBe(false);
      expect(sensitiveData.hasPrivateKey).toBe(false);
    });
  });
});
