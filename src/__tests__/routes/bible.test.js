"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const bible_1 = __importDefault(require("../../routes/bible"));
const errorMiddleware_1 = require("../../middleware/errorMiddleware");
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
    let app;
    beforeAll(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/bible', bible_1.default);
        app.use(errorMiddleware_1.errorMiddleware);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /bible/:languageCode', () => {
        it('should return 404 if language is not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const { prisma } = require('../../index');
            prisma.language.findUnique.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app).get('/bible/unknownlanguage');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('status', 'error');
            expect(response.body).toHaveProperty('message');
        }));
        it('should return language data when found', () => __awaiter(void 0, void 0, void 0, function* () {
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
            const response = yield (0, supertest_1.default)(app).get('/bible/en');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('language', 'en');
            expect(response.body).toHaveProperty('version', 'KJV');
        }));
    });
    describe('GET /bible/version/:versionCode', () => {
        it('should return 404 if version is not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const { prisma } = require('../../index');
            prisma.version.findUnique.mockResolvedValue(null);
            const response = yield (0, supertest_1.default)(app).get('/bible/version/unknownversion');
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('status', 'error');
        }));
    });
    describe('GET /bible/search', () => {
        it('should return 400 if query parameter is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/bible/search');
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('status', 'error');
        }));
    });
});
