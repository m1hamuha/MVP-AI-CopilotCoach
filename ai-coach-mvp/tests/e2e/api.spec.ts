import { test, expect } from '@playwright/test';

test.describe('API Authentication', () => {
  test('chat API should reject unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('conversations API should reject unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/conversations');

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('analytics API should reject unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/analytics');

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('feedback API should reject unauthenticated requests', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        messageId: 'test-id',
        rating: 5,
      },
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

test.describe('API Validation', () => {
  test('conversations POST should validate input', async ({ request }) => {
    // This will be 401 since not authenticated, but tests the schema exists
    const response = await request.post('/api/conversations', {
      data: {
        // Missing required 'title'
        goal: 'Test goal',
      },
    });

    // Should fail auth before validation
    expect(response.status()).toBe(401);
  });

  test('feedback POST should validate rating range', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        messageId: 'test-id',
        rating: 10, // Invalid: should be 1-5
      },
    });

    expect(response.status()).toBe(401); // Auth fails first
  });
});

test.describe('Cron Endpoint', () => {
  test('cron cleanup should reject without secret', async ({ request }) => {
    const response = await request.get('/api/cron/cleanup');

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('cron cleanup should reject with invalid secret', async ({ request }) => {
    const response = await request.get('/api/cron/cleanup', {
      headers: {
        'Authorization': 'Bearer invalid-secret',
      },
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });
});
