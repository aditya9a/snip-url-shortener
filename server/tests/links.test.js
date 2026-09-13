import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import Link from '../src/models/Link.js';
import Click from '../src/models/Click.js';

describe('Links & Redirect Endpoints', () => {
  let cookie;

  const testUser = {
    name: 'Link Tester',
    email: 'linktester@example.com',
    password: 'password123',
  };

  // Run before each test: create a fresh user and get their JWT cookie
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/auth/login').send(testUser);
    cookie = loginRes.headers['set-cookie'];
  });

  // Helper to create a link for tests that need an existing link
  const createTestLink = async (customAlias) => {
    const payload = {
      originalUrl: 'https://example.com/test',
      title: 'Test Link'
    };
    if (customAlias) payload.customAlias = customAlias;

    const res = await request(app).post('/api/links').set('Cookie', cookie).send(payload);
    return res.body.data.link;
  };

  describe('POST /api/links', () => {
    it('should create a short link successfully', async () => {
      const payload = {
        originalUrl: 'https://example.com/very/long/path/for/testing',
        title: 'Test Link'
      };

      const res = await request(app)
        .post('/api/links')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.link.originalUrl).toBe(payload.originalUrl);
      expect(res.body.data.link.shortCode).toBeDefined();
    });

    it('should fail if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ originalUrl: 'https://example.com' });

      expect(res.statusCode).toBe(401);
    });

    it('should respect custom aliases', async () => {
      const payload = {
        originalUrl: 'https://example.com/another',
        customAlias: 'my-custom-alias'
      };

      const res = await request(app)
        .post('/api/links')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.link.shortCode).toBe('my-custom-alias');
    });

    it('should prevent duplicate custom aliases', async () => {
      // Seed a link with a custom alias
      await createTestLink('taken-alias');

      // Try to use it again
      const payload = {
        originalUrl: 'https://example.com/third',
        customAlias: 'taken-alias'
      };

      const res = await request(app)
        .post('/api/links')
        .set('Cookie', cookie)
        .send(payload);

      expect(res.statusCode).toBe(409); // Conflict
    });
  });

  describe('GET /:shortCode (Redirect)', () => {
    it('should redirect to the original URL (302) if found', async () => {
      const link = await createTestLink();

      const res = await request(app).get(`/${link.shortCode}`);

      // We expect a 302 redirect to the original URL
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(link.originalUrl);
    });

    it('should redirect to the error page (302) for non-existent short code', async () => {
      const res = await request(app).get(`/this-does-not-exist`);

      // Our redirect engine sends users to the frontend error page
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain('/error?type=not_found');
    });
  });

  describe('GET /api/links/:id/analytics', () => {
    it('should return analytics data for a link', async () => {
      const link = await createTestLink();

      // Simulate a click (the redirect endpoint fires analytics asynchronously,
      // but for testing we can just hit the endpoint and await it, or manually seed a Click)
      // We will just hit the endpoint and wait a bit, or seed directly.
      await request(app).get(`/${link.shortCode}`);
      
      // Wait a tiny bit for the async analytics to process
      await new Promise(resolve => setTimeout(resolve, 50));

      const res = await request(app)
        .get(`/api/links/${link.id}/analytics`)
        .set('Cookie', cookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.link.totalClicks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.analytics.geographic)).toBe(true);
    });
  });
});
