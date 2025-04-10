import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ApiError } from '../utils/errorHandler';

/**
 * Get Bible data by language code
 * Retrieves a complete Bible dataset for the specified language
 */
export const getBibleByLanguage = async (req: Request, res: Response, next: NextFunction) => {
  const { languageCode } = req.params;

  try {
    // Find the language
    const language = await prisma.language.findUnique({
      where: { code: languageCode },
      include: {
        versions: true
      }
    });

    if (!language || language.versions.length === 0) {
      throw new ApiError(404, `Bible data for language '${languageCode}' not found`);
    }

    // Default to the first version if not specified
    const version = language.versions[0];

    // Get all books
    const books = await prisma.book.findMany({
      orderBy: { number: 'asc' }
    });

    // Process books to include chapters and verses
    const bibleData = {
      language: language.code,
      languageName: language.name,
      version: version.code,
      versionName: version.name,
      books: await Promise.all(books.map(async (book) => {
        // Get all chapters for this book
        const chapters = await prisma.chapter.findMany({
          where: { bookId: book.id },
          orderBy: { chapterNum: 'asc' }
        });

        // Process chapters to include verses
        return {
          name: book.name,
          slug: book.slug,
          number: book.number,
          chapters: await Promise.all(chapters.map(async (chapter) => {
            // Get all verses for this chapter in the current version
            const verses = await prisma.verse.findMany({
              where: { 
                chapterId: chapter.id,
                versionId: version.id
              },
              orderBy: { verseNumber: 'asc' },
              include: {
                audios: true // Include audio files associated with each verse
              }
            });

            return {
              chapterNum: chapter.chapterNum,
              verses: verses.map(verse => ({
                verseNumber: verse.verseNumber,
                text: verse.text,
                audios: verse.audios.map(audio => ({
                  language: audio.language,
                  url: audio.url,
                  duration: audio.duration,
                  format: audio.format
                }))
              }))
            };
          }))
        };
      }))
    };

    res.json(bibleData);
  } catch (error) {
    next(error); // Pass errors to the error handling middleware
  }
};

/**
 * Get Bible data by version code
 * Retrieves a complete Bible dataset for the specified version
 */
export const getBibleByVersion = async (req: Request, res: Response, next: NextFunction) => {
  const { versionCode } = req.params;

  try {
    // Find the version
    const version = await prisma.version.findUnique({
      where: { code: versionCode },
      include: {
        language: true
      }
    });

    if (!version) {
      throw new ApiError(404, `Bible data for version '${versionCode}' not found`);
    }

    // Get all books
    const books = await prisma.book.findMany({
      orderBy: { number: 'asc' }
    });

    // Process books to include chapters and verses
    const bibleData = {
      language: version.language.code,
      languageName: version.language.name,
      version: version.code,
      versionName: version.name,
      books: await Promise.all(books.map(async (book) => {
        // Get all chapters for this book
        const chapters = await prisma.chapter.findMany({
          where: { bookId: book.id },
          orderBy: { chapterNum: 'asc' }
        });

        // Process chapters to include verses
        return {
          name: book.name,
          slug: book.slug,
          number: book.number,
          chapters: await Promise.all(chapters.map(async (chapter) => {
            // Get all verses for this chapter in the specified version
            const verses = await prisma.verse.findMany({
              where: { 
                chapterId: chapter.id,
                versionId: version.id
              },
              orderBy: { verseNumber: 'asc' },
              include: {
                audios: true
              }
            });

            return {
              chapterNum: chapter.chapterNum,
              verses: verses.map(verse => ({
                verseNumber: verse.verseNumber,
                text: verse.text,
                audios: verse.audios.map(audio => ({
                  language: audio.language,
                  url: audio.url,
                  duration: audio.duration,
                  format: audio.format
                }))
              }))
            };
          }))
        };
      }))
    };

    res.json(bibleData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific book from the Bible by version and book slug
 */
export const getBookBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const { versionCode, bookSlug } = req.params;

  try {
    // Find the version
    const version = await prisma.version.findUnique({
      where: { code: versionCode },
      include: {
        language: true
      }
    });

    if (!version) {
      throw new ApiError(404, `Version '${versionCode}' not found`);
    }

    // Find the book
    const book = await prisma.book.findUnique({
      where: { slug: bookSlug }
    });

    if (!book) {
      throw new ApiError(404, `Book '${bookSlug}' not found`);
    }

    // Get all chapters for this book
    const chapters = await prisma.chapter.findMany({
      where: { bookId: book.id },
      orderBy: { chapterNum: 'asc' }
    });

    // Process chapters to include verses
    const bookData = {
      language: version.language.code,
      languageName: version.language.name,
      version: version.code,
      versionName: version.name,
      book: {
        name: book.name,
        slug: book.slug,
        number: book.number,
        chapters: await Promise.all(chapters.map(async (chapter) => {
          // Get all verses for this chapter in the specified version
          const verses = await prisma.verse.findMany({
            where: { 
              chapterId: chapter.id,
              versionId: version.id
            },
            orderBy: { verseNumber: 'asc' },
            include: {
              audios: true
            }
          });

          return {
            chapterNum: chapter.chapterNum,
            verses: verses.map(verse => ({
              verseNumber: verse.verseNumber,
              text: verse.text,
              audios: verse.audios.map(audio => ({
                language: audio.language,
                url: audio.url,
                duration: audio.duration,
                format: audio.format
              }))
            }))
          };
        }))
      }
    };

    res.json(bookData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific chapter from a book by version, book slug, and chapter number
 */
export const getChapter = async (req: Request, res: Response, next: NextFunction) => {
  const { versionCode, bookSlug, chapterNum } = req.params;
  const chapterNumber = parseInt(chapterNum, 10);

  try {
    // Input validation
    if (isNaN(chapterNumber)) {
      throw new ApiError(400, 'Chapter number must be a valid number');
    }

    // Find the version
    const version = await prisma.version.findUnique({
      where: { code: versionCode },
      include: {
        language: true
      }
    });

    if (!version) {
      throw new ApiError(404, `Version '${versionCode}' not found`);
    }

    // Find the book
    const book = await prisma.book.findUnique({
      where: { slug: bookSlug }
    });

    if (!book) {
      throw new ApiError(404, `Book '${bookSlug}' not found`);
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: { 
        bookId: book.id,
        chapterNum: chapterNumber
      }
    });

    if (!chapter) {
      throw new ApiError(404, `Chapter ${chapterNumber} in book '${bookSlug}' not found`);
    }

    // Get all verses for this chapter in the specified version
    const verses = await prisma.verse.findMany({
      where: { 
        chapterId: chapter.id,
        versionId: version.id
      },
      orderBy: { verseNumber: 'asc' },
      include: {
        audios: true
      }
    });

    // Return chapter data
    const chapterData = {
      language: version.language.code,
      languageName: version.language.name,
      version: version.code,
      versionName: version.name,
      book: {
        name: book.name,
        slug: book.slug,
        number: book.number
      },
      chapter: {
        chapterNum: chapter.chapterNum,
        verses: verses.map(verse => ({
          verseNumber: verse.verseNumber,
          text: verse.text,
          audios: verse.audios.map(audio => ({
            language: audio.language,
            url: audio.url,
            duration: audio.duration,
            format: audio.format
          }))
        }))
      }
    };

    res.json(chapterData);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific verse by version, book slug, chapter number, and verse number
 */
export const getVerse = async (req: Request, res: Response, next: NextFunction) => {
  const { versionCode, bookSlug, chapterNum, verseNum } = req.params;
  const chapterNumber = parseInt(chapterNum, 10);
  const verseNumber = parseInt(verseNum, 10);

  try {
    // Input validation
    if (isNaN(chapterNumber)) {
      throw new ApiError(400, 'Chapter number must be a valid number');
    }
    
    if (isNaN(verseNumber)) {
      throw new ApiError(400, 'Verse number must be a valid number');
    }

    // Find the version
    const version = await prisma.version.findUnique({
      where: { code: versionCode },
      include: {
        language: true
      }
    });

    if (!version) {
      throw new ApiError(404, `Version '${versionCode}' not found`);
    }

    // Find the book
    const book = await prisma.book.findUnique({
      where: { slug: bookSlug }
    });

    if (!book) {
      throw new ApiError(404, `Book '${bookSlug}' not found`);
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: { 
        bookId: book.id,
        chapterNum: chapterNumber
      }
    });

    if (!chapter) {
      throw new ApiError(404, `Chapter ${chapterNumber} in book '${bookSlug}' not found`);
    }

    // Find the verse
    const verse = await prisma.verse.findFirst({
      where: { 
        chapterId: chapter.id,
        versionId: version.id,
        verseNumber: verseNumber
      },
      include: {
        audios: true
      }
    });

    if (!verse) {
      throw new ApiError(404, `Verse ${verseNumber} in chapter ${chapterNumber} of book '${bookSlug}' not found`);
    }

    // Return verse data
    const verseData = {
      language: version.language.code,
      languageName: version.language.name,
      version: version.code,
      versionName: version.name,
      book: {
        name: book.name,
        slug: book.slug,
        number: book.number
      },
      chapter: {
        chapterNum: chapter.chapterNum
      },
      verse: {
        verseNumber: verse.verseNumber,
        text: verse.text,
        audios: verse.audios.map(audio => ({
          language: audio.language,
          url: audio.url,
          duration: audio.duration,
          format: audio.format
        }))
      }
    };

    res.json(verseData);
  } catch (error) {
    next(error);
  }
};

/**
 * Search for verses by text
 */
export const searchVerses = async (req: Request, res: Response, next: NextFunction) => {
  const { versionCode, query } = req.query;
  
  try {
    if (!query || typeof query !== 'string') {
      throw new ApiError(400, 'Search query is required');
    }

    // Find the version if specified
    let versionId: number | undefined;
    
    if (versionCode && typeof versionCode === 'string') {
      const version = await prisma.version.findUnique({
        where: { code: versionCode }
      });
      
      if (!version) {
        throw new ApiError(404, `Version '${versionCode}' not found`);
      }
      
      versionId = version.id;
    }

    // Prepare search parameters
    const searchParams: any = {
      where: {
        text: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        version: {
          include: {
            language: true
          }
        },
        chapter: {
          include: {
            book: true
          }
        },
        audios: true
      },
      take: 100 // Limit results to prevent overwhelming response
    };

    // Add version filter if specified
    if (versionId) {
      searchParams.where.versionId = versionId;
    }

    // Search for verses
    const verses = await prisma.verse.findMany(searchParams);

    // Format results
    const results = verses.map(verse => {
      // TypeScript needs explicit typing due to the prisma.verse.findMany with dynamic includes
      type VerseWithRelations = {
        id: number;
        verseNumber: number;
        text: string;
        versionId: number;
        chapterId: number;
        version: {
          id: number;
          code: string;
          name: string;
          language: {
            id: number;
            code: string;
            name: string;
          };
        };
        chapter: {
          id: number;
          chapterNum: number;
          book: {
            id: number;
            name: string;
            slug: string;
            number: number;
          };
        };
        audios: Array<{
          id: number;
          language: string;
          url: string;
          duration: number | null;
          format: string | null;
        }>;
      };

      const typedVerse = verse as VerseWithRelations;

      return {
        language: typedVerse.version.language.code,
        languageName: typedVerse.version.language.name,
        version: typedVerse.version.code,
        versionName: typedVerse.version.name,
        book: {
          name: typedVerse.chapter.book.name,
          slug: typedVerse.chapter.book.slug,
          number: typedVerse.chapter.book.number
        },
        chapter: {
          chapterNum: typedVerse.chapter.chapterNum
        },
        verse: {
          verseNumber: typedVerse.verseNumber,
          text: typedVerse.text,
          audios: typedVerse.audios.map(audio => ({
            language: audio.language,
            url: audio.url,
            duration: audio.duration,
            format: audio.format
          }))
        }
      };
    });

    res.json({
      query,
      count: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
}; 