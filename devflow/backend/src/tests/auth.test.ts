import request from 'supertest';
import app from '../index';
import { prisma } from '../config/database';
import { connectRedis, getRedis } from '../config/redis';

beforeAll(async () => {
  connectRedis();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { email: { contains: '@test.devflow' } } } });
  await prisma.user.deleteMany({ where: { email: { contains: '@test.devflow' } } });
  await prisma.$disconnect();
  await getRedis().quit();
});

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@test.devflow`,
    password: 'Password123!',
  };

  let accessToken = '';
  let refreshToken = '';

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email with 409', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(409);
    });

    it('should reject missing fields with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'bad@test.devflow' });
      expect(res.status).toBe(400);
    });

    it('should reject short password with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Bad', email: 'bad2@test.devflow', password: '123',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email, password: testUser.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(testUser.email);

      // ✅ Save tokens from LOGIN for use in later tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject wrong password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email, password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('should reject non-existent user with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.devflow', password: 'Password123!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      // ✅ Uses refreshToken saved from login test above
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'fake.token' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});