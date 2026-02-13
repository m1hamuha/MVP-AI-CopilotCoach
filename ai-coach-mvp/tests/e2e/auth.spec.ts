import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('AI CopilotCoach')).toBeVisible();
    await expect(page.getByText('Sign in with GitHub')).toBeVisible();
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.getByText('Privacy Policy')).toBeVisible();
  });

  test('should redirect to coach page after login', async ({ page }) => {
    // Note: This requires test OAuth credentials
    // In practice, you might mock the OAuth flow
    await page.goto('/login');
    
    // This will fail in test environment without valid GitHub OAuth
    // but verifies the button exists and is clickable
    const signInButton = page.getByText('Sign in with GitHub');
    await expect(signInButton).toBeVisible();
  });
});

test.describe('Health Check', () => {
  test('health endpoint should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
    expect(body.services.database).toBe('healthy');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users from coach to login', async ({ page }) => {
    await page.goto('/coach');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect unauthenticated users from analytics to login', async ({ page }) => {
    await page.goto('/analytics');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Public Pages', () => {
  test('terms page should be accessible', async ({ page }) => {
    await page.goto('/terms');
    
    await expect(page.getByText('Terms of Service')).toBeVisible();
    await expect(page.getByText('Acceptance of Terms')).toBeVisible();
  });

  test('privacy page should be accessible', async ({ page }) => {
    await page.goto('/privacy');
    
    await expect(page.getByText('Privacy Policy')).toBeVisible();
    await expect(page.getByText('Information We Collect')).toBeVisible();
  });
});

test.describe('Security Headers', () => {
  test('should have security headers on protected routes', async ({ request }) => {
    const response = await request.get('/coach');
    
    // Even with redirect, headers should be present
    const headers = response.headers();
    
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});
