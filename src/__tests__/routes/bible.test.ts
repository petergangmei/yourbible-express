import request from 'supertest';
import express from 'express';
import bibleRoutes from '../../routes/bible';
import { errorMiddleware } from '../../middleware/errorMiddleware';

// Mock the Prisma client and controllers
jest.mock('../../index', () => ({
  prisma: {
    language: {
      findUnique: jest.fn()
    },
    version: {
      findUnique: jest.fn()
    },
    book: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    chapter: {
      findMany: jest.fn(),
      findFirst: jest.fn()
    },
    verse: {
      findMany: jest.fn(),
      findFirst: jest.fn()
    }
  }
}));

describe('Bible Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/bible', bibleRoutes);
    app.use(errorMiddleware);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /bible/:languageCode', () => {
    it('should return 404 if language is not found', async () => {
      const { prisma } = require('../../index');
      prisma.language.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/bible/unknownlanguage');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return language data when found', async () => {
      const { prisma } = require('../../index');
      
      const mockLanguage = {
        id: 1,
        code: 'en',
        name: 'English',
        versions: [
          { id: 1, code: 'KJV', name: 'King James Version', languageId: 1 }
        ]
      };
      
      prisma.language.findUnique.mockResolvedValue(mockLanguage);
      prisma.book.findMany.mockResolvedValue([]);
      
      const response = await request(app).get('/bible/en');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');
      expect(response.body).toHaveProperty('version', 'KJV');
    });
  });

  describe('GET /bible/version/:versionCode', () => {
    it('should return 404 if version is not found', async () => {
      const { prisma } = require('../../index');
      prisma.version.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/bible/version/unknownversion');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('GET /bible/search', () => {
    it('should return 400 if query parameter is missing', async () => {
      const response = await request(app).get('/bible/search');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
}); 