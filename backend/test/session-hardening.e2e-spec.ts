import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import { MailService } from '../src/mail/mail.service';

jest.setTimeout(30000);

describe('Session Hardening & Identity (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendMemberAddedEmail: jest.fn().mockResolvedValue(true), sendVerificationEmail: jest.fn().mockResolvedValue(true), sendPasswordResetEmail: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet()); // Simulate main.ts behavior
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('JWT Revocation & Logout', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      // Register a user to get a token
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Session Test User',
          email: `session-${Date.now()}@example.com`,
          password: 'Password123!',
          passwordConfirmation: 'Password123!',
          organisationName: 'Session Test Org',
        });
      
      await prisma.user.update({ where: { id: res.body.user.id }, data: { isEmailVerified: true } });
      const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: res.body.user.email, password: 'Password123!' });
      accessToken = loginRes.body.accessToken;
      userId = res.body.user.id;
    });

    it('should successfully access a protected route with a valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
    });

    it('should successfully logout', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully.');
    });

    it('should return 401 Unauthorized when using a revoked token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token has been revoked');
    });
  });

  describe('Helmet Security Headers', () => {
    it('should include helmet security headers in responses', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs'); // or any route
      
      expect(res.headers['x-xss-protection']).toBe('0');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Organisation Membership Revocation Isolation', () => {
    let accessToken: string;
    let orgId: string;
    let memberId: string;
    let adminToken: string;

    beforeAll(async () => {
      // Create admin and org
      const adminRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Admin User',
          email: `admin-iso-${Date.now()}@example.com`,
          password: 'Password123!',
          passwordConfirmation: 'Password123!',
          organisationName: 'Isolation Test Org',
        });
      
      await prisma.user.update({ where: { id: adminRes.body.user.id }, data: { isEmailVerified: true } });
      const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: adminRes.body.user.email, password: 'Password123!' });
      adminToken = adminLoginRes.body.accessToken;
      orgId = adminRes.body.user.memberships[0].organisation.id;

      // Create a second user
      const userRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Member User',
          email: `member-iso-${Date.now()}@example.com`,
          password: 'Password123!',
          passwordConfirmation: 'Password123!',
          organisationName: 'Another Org',
        });
      
      await prisma.user.update({ where: { id: userRes.body.user.id }, data: { isEmailVerified: true } });
      const userLoginRes = await request(app.getHttpServer()).post('/auth/login').send({ email: userRes.body.user.email, password: 'Password123!' });
      accessToken = userLoginRes.body.accessToken;
      memberId = userRes.body.user.id;

      // Add the second user to the admin's org
      await request(app.getHttpServer())
        .post(`/organisations/${orgId}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: userRes.body.user.email, role: 'BOARD_MEMBER' });
    });

    it('should allow access to organisation resources while a member', async () => {
      const res = await request(app.getHttpServer())
        .get(`/meetings?organisationId=${orgId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200); // 200 OK means access granted
    });

    it('should revoke access to organisation resources immediately upon removal', async () => {
      // Admin removes the member
      const removeRes = await request(app.getHttpServer())
        .delete(`/organisations/${orgId}/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(removeRes.status).toBe(200);

      // The removed member tries to access the org again
      const res = await request(app.getHttpServer())
        .get(`/meetings?organisationId=${orgId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(403); // 403 Forbidden because requireMembership fails
    });

    it('should still allow the user to access their own resources', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200); // Global JWT is still valid
    });
  });
});
