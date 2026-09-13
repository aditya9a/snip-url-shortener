import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import User from '../src/models/User.js';

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email);
      
      // Verify JWT cookie is set
      expect(res.headers['set-cookie']).toBeDefined();
      
      // Verify user was saved to DB
      const dbUser = await User.findOne({ email: testUser.email });
      expect(dbUser).toBeTruthy();
    });

    it('should fail if email already exists', async () => {
      // Seed first
      await request(app).post('/api/auth/register').send(testUser);
      
      // Try again
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(409); // Conflict
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exists/i);
    });

    it('should fail with missing fields (Zod validation)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Only Name' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // Seed
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      // Seed
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
