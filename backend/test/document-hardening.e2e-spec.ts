import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import { MailService } from '../src/mail/mail.service';

jest.setTimeout(30000);

describe('Cloud Storage & File Hardening (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orgId: string;
  let accessToken: string;
  let userAId: string;
  let orgBId: string;
  let userBToken: string;
  let userBId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendMemberAddedEmail: jest.fn().mockResolvedValue(true), sendVerificationEmail: jest.fn().mockResolvedValue(true), sendPasswordResetEmail: jest.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register User A & Org A
    const resA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User A',
        email: `docA-${Date.now()}@example.com`,
        password: 'Password123!',
          passwordConfirmation: 'Password123!',
        organisationName: 'Org A',
      });
    await prisma.user.update({ where: { id: resA.body.user.id }, data: { isEmailVerified: true } });
      const loginResA = await request(app.getHttpServer()).post('/auth/login').send({ email: resA.body.user.email, password: 'Password123!' });
      accessToken = loginResA.body.accessToken;
    orgId = resA.body.user.memberships[0].organisation.id;
    userAId = resA.body.user.id;

    // Register User B & Org B
    const resB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User B',
        email: `docB-${Date.now()}@example.com`,
        password: 'Password123!',
          passwordConfirmation: 'Password123!',
        organisationName: 'Org B',
      });
    await prisma.user.update({ where: { id: resB.body.user.id }, data: { isEmailVerified: true } });
      const loginResB = await request(app.getHttpServer()).post('/auth/login').send({ email: resB.body.user.email, password: 'Password123!' });
      userBToken = loginResB.body.accessToken;
    orgBId = resB.body.user.memberships[0].organisationId;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('File Validation', () => {
    it('should reject an oversized file (>20MB)', async () => {
      // Mock a file larger than 20MB
      const largeBuffer = Buffer.alloc(21 * 1024 * 1024, 'a');
      
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('organisationId', orgId)
        .attach('file', largeBuffer, 'test.pdf');
        
      expect(res.status).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
      expect(res.body.message).toMatch(/exceeds the 20MB limit/);
    });

    it('should reject a disallowed MIME type', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('organisationId', orgId)
        .attach('file', Buffer.from('hello'), {
          filename: 'test.html',
          contentType: 'text/html',
        });
        
      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toMatch(/Unsupported file type/);
    });

    it('should reject a disallowed extension even if MIME is forced', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('organisationId', orgId)
        .attach('file', Buffer.from('malicious'), {
          filename: 'test.exe',
          contentType: 'application/pdf',
        });
        
      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toMatch(/Unsupported file extension/);
    });

    it('should reject mismatched MIME and extension', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('organisationId', orgId)
        .attach('file', Buffer.from('fake pdf'), {
          filename: 'test.pdf',
          contentType: 'image/png',
        });
        
      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toMatch(/does not match file extension/);
    });
  });

  describe('Authorization / IDOR', () => {
    it('should prevent User B from accessing Org A documents list', async () => {
      const res = await request(app.getHttpServer())
        .get(`/documents?organisationId=${orgId}`)
        .set('Authorization', `Bearer ${userBToken}`);
        
      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should prevent User B from deleting Org A documents (even if they knew ID)', async () => {
      const doc = await prisma.document.create({
        data: {
          organisationId: orgId,
          fileName: 'dummy.pdf',
          originalName: 'dummy.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 100,
          storagePath: 'https://res.cloudinary.com/dummy/upload/v1/dummy.pdf',
          uploadedById: userAId,
          versions: {
             create: {
                version: 1,
                storagePath: 'https://res.cloudinary.com/dummy/upload/v1/dummy.pdf',
                sizeBytes: 100,
                uploadedById: userAId,
             }
          }
        }
      });

      const res = await request(app.getHttpServer())
        .delete(`/documents/${doc.id}`)
        .set('Authorization', `Bearer ${userBToken}`);
        
      expect(res.status).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
