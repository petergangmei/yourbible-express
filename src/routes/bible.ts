import express from 'express';
import { 
  getBibleByLanguage, 
  getBibleByVersion,
  getBookBySlug,
  getChapter,
  getVerse,
  searchVerses
} from '../controllers/bibleController';
import { validateQueryParams, validateRequestParams } from '../middleware/validationMiddleware';

const router = express.Router();

/**
 * @swagger
 * /bible/search:
 *   get:
 *     summary: Search for verses by text
 *     tags: [Bible]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Text to search for in verses
 *       - in: query
 *         name: versionCode
 *         schema:
 *           type: string
 *         required: false
 *         description: Bible version code to restrict search
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 results:
 *                   type: array
 *       400:
 *         description: Bad request, missing query parameter
 *       404:
 *         description: Version not found
 */
router.get('/search', validateQueryParams(['query']), searchVerses);

/**
 * @swagger
 * /bible/language/{languageCode}:
 *   get:
 *     summary: Get Bible data by language
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: languageCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Language code (e.g., 'en', 'ruanglat')
 *     responses:
 *       200:
 *         description: Complete Bible dataset for the specified language
 *       404:
 *         description: Language not found
 */
router.get('/language/:languageCode', validateRequestParams(['languageCode']), getBibleByLanguage);

/**
 * @swagger
 * /bible/version/{versionCode}:
 *   get:
 *     summary: Get Bible data by version
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: versionCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Version code (e.g., 'KJV', 'RONGBSI')
 *     responses:
 *       200:
 *         description: Complete Bible dataset for the specified version
 *       404:
 *         description: Version not found
 */
router.get('/version/:versionCode', validateRequestParams(['versionCode']), getBibleByVersion);

/**
 * @swagger
 * /bible/version/{versionCode}/book/{bookSlug}:
 *   get:
 *     summary: Get a specific book from the Bible
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: versionCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Version code (e.g., 'KJV', 'RONGBSI')
 *       - in: path
 *         name: bookSlug
 *         schema:
 *           type: string
 *         required: true
 *         description: Book slug (e.g., 'genesis', 'psalms')
 *     responses:
 *       200:
 *         description: Book data including all chapters and verses
 *       404:
 *         description: Version or book not found
 */
router.get(
  '/version/:versionCode/book/:bookSlug', 
  validateRequestParams(['versionCode', 'bookSlug']), 
  getBookBySlug
);

/**
 * @swagger
 * /bible/version/{versionCode}/book/{bookSlug}/chapter/{chapterNum}:
 *   get:
 *     summary: Get a specific chapter from a book
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: versionCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Version code (e.g., 'KJV', 'RONGBSI')
 *       - in: path
 *         name: bookSlug
 *         schema:
 *           type: string
 *         required: true
 *         description: Book slug (e.g., 'genesis', 'psalms')
 *       - in: path
 *         name: chapterNum
 *         schema:
 *           type: integer
 *         required: true
 *         description: Chapter number
 *     responses:
 *       200:
 *         description: Chapter data including all verses
 *       400:
 *         description: Invalid chapter number
 *       404:
 *         description: Version, book, or chapter not found
 */
router.get(
  '/version/:versionCode/book/:bookSlug/chapter/:chapterNum', 
  validateRequestParams(['versionCode', 'bookSlug', 'chapterNum']), 
  getChapter
);

/**
 * @swagger
 * /bible/version/{versionCode}/book/{bookSlug}/chapter/{chapterNum}/verse/{verseNum}:
 *   get:
 *     summary: Get a specific verse
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: versionCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Version code (e.g., 'KJV', 'RONGBSI')
 *       - in: path
 *         name: bookSlug
 *         schema:
 *           type: string
 *         required: true
 *         description: Book slug (e.g., 'genesis', 'psalms')
 *       - in: path
 *         name: chapterNum
 *         schema:
 *           type: integer
 *         required: true
 *         description: Chapter number
 *       - in: path
 *         name: verseNum
 *         schema:
 *           type: integer
 *         required: true
 *         description: Verse number
 *     responses:
 *       200:
 *         description: Verse data including text and audio
 *       400:
 *         description: Invalid chapter or verse number
 *       404:
 *         description: Version, book, chapter, or verse not found
 */
router.get(
  '/version/:versionCode/book/:bookSlug/chapter/:chapterNum/verse/:verseNum', 
  validateRequestParams(['versionCode', 'bookSlug', 'chapterNum', 'verseNum']), 
  getVerse
);

/**
 * @swagger
 * /bible/{languageCode}:
 *   get:
 *     summary: Get Bible data by language (legacy endpoint)
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: languageCode
 *         schema:
 *           type: string
 *         required: true
 *         description: Language code (e.g., 'en', 'ruanglat')
 *     responses:
 *       200:
 *         description: Complete Bible dataset for the specified language
 *       404:
 *         description: Language not found
 */
router.get('/:languageCode', validateRequestParams(['languageCode']), getBibleByLanguage);

export default router; 