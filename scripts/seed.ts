/**
 * Script for seeding the database with Bible data
 * 
 * This script reads a JSON file containing Bible data and inserts it into the database
 * 
 * Usage: npx ts-node scripts/seed.ts <path-to-bible-json-file>
 * 
 * Example JSON format (simplified):
 * {
 *   "language": {
 *     "code": "en",
 *     "name": "English"
 *   },
 *   "version": {
 *     "code": "KJV",
 *     "name": "King James Version"
 *   },
 *   "books": [
 *     {
 *       "name": "Genesis",
 *       "slug": "genesis",
 *       "number": 1,
 *       "chapters": [
 *         {
 *           "chapterNum": 1,
 *           "verses": [
 *             {
 *               "verseNumber": 1,
 *               "text": "In the beginning God created the heaven and the earth."
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Create a Prisma client instance
const prisma = new PrismaClient();

// Main seeding function
async function main() {
  console.log('Starting Bible data seeding...');

  // Get file path from command line argument
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Error: Bible JSON file path not provided.');
    console.log('Usage: npx ts-node scripts/seed.ts <path-to-bible-json-file>');
    process.exit(1);
  }

  try {
    // Read and parse the Bible JSON file
    const bibleData = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
    
    // Extract language, version, and books data
    const { language, version, books } = bibleData;
    
    // Validate data structure
    if (!language || !version || !books || !Array.isArray(books)) {
      throw new Error('Invalid Bible data format. Check the file structure.');
    }

    console.log(`Processing ${books.length} books from ${version.name} (${language.name})...`);

    // Upsert the language
    const dbLanguage = await prisma.language.upsert({
      where: { code: language.code },
      update: { name: language.name },
      create: { code: language.code, name: language.name }
    });
    console.log(`Language ${dbLanguage.name} (${dbLanguage.code}) processed.`);

    // Upsert the version
    const dbVersion = await prisma.version.upsert({
      where: { code: version.code },
      update: { name: version.name, languageId: dbLanguage.id },
      create: { code: version.code, name: version.name, languageId: dbLanguage.id }
    });
    console.log(`Version ${dbVersion.name} (${dbVersion.code}) processed.`);

    // Process each book
    for (const book of books) {
      // Upsert the book
      const dbBook = await prisma.book.upsert({
        where: { slug: book.slug },
        update: { name: book.name, number: book.number },
        create: { name: book.name, slug: book.slug, number: book.number }
      });
      console.log(`Book ${dbBook.name} processed.`);

      // Process each chapter in the book
      for (const chapter of book.chapters) {
        // Upsert the chapter
        const dbChapter = await prisma.chapter.upsert({
          where: { 
            bookId_chapterNum: { 
              bookId: dbBook.id, 
              chapterNum: chapter.chapterNum 
            } 
          },
          update: {},
          create: {
            bookId: dbBook.id,
            chapterNum: chapter.chapterNum
          }
        });
        
        // Process each verse in the chapter
        for (const verse of chapter.verses) {
          // Upsert the verse
          const dbVerse = await prisma.verse.upsert({
            where: {
              versionId_chapterId_verseNumber: {
                versionId: dbVersion.id,
                chapterId: dbChapter.id,
                verseNumber: verse.verseNumber
              }
            },
            update: { text: verse.text },
            create: {
              versionId: dbVersion.id,
              chapterId: dbChapter.id,
              verseNumber: verse.verseNumber,
              text: verse.text
            }
          });

          // Process audio files if present
          if (verse.audios && Array.isArray(verse.audios)) {
            for (const audioData of verse.audios) {
              await prisma.audio.upsert({
                where: {
                  id: audioData.id || 0 // If id exists, use it, otherwise use 0 which won't match
                },
                update: {
                  language: audioData.language,
                  url: audioData.url,
                  duration: audioData.duration,
                  format: audioData.format
                },
                create: {
                  verseId: dbVerse.id,
                  language: audioData.language,
                  url: audioData.url,
                  duration: audioData.duration,
                  format: audioData.format
                }
              });
            }
          }
        }
        
        console.log(`Chapter ${dbChapter.chapterNum} of ${dbBook.name} processed.`);
      }
    }

    console.log('Bible data seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding Bible data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the main function
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 