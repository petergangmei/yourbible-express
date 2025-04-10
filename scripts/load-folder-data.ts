/**
 * Script for loading Bible data from a folder structure
 * 
 * The expected structure is:
 * /data
 *   /[language_code]
 *     /[book_slug]
 *       /1.json (chapter 1)
 *       /2.json (chapter 2)
 *       ...
 * 
 * Usage: npx ts-node scripts/load-folder-data.ts [language_code]
 * Example: npx ts-node scripts/load-folder-data.ts rongbsi
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Create a Prisma client instance
const prisma = new PrismaClient();

// Map book slugs to book numbers (order in the Bible)
const bookNumberMap: Record<string, number> = {
  'thaureymei': 1,    // Genesis
  'tatpatmei': 2,     // Exodus
  // Add more books as needed with their respective order numbers
};

// Map book slugs to English names
const bookNameMap: Record<string, string> = {
  'thaureymei': 'Genesis',
  'tatpatmei': 'Exodus',
  // Add more books as needed
};

// Map language codes to language names
const languageNameMap: Record<string, string> = {
  'ruanglat': 'Rongmei',
  // Add more languages as needed
};

// Map language codes to version codes and names
const versionMap: Record<string, { code: string, name: string }> = {
  'ruanglat': { code: 'RONGBSI', name: 'Rongmei Bible Society India' },
  // Add more versions as needed
};

interface ChapterContent {
  book: string;
  slug: string;
  chapter: number;
  language: string;
  content: Array<Record<string, string>>;
}

async function processChapter(
  languageCode: string,
  bookSlug: string,
  chapterFile: string,
  versionId: number,
  bookId: number,
  chapterId: number
): Promise<void> {
  try {
    const chapterPath = path.join(process.cwd(), 'data', languageCode, bookSlug, chapterFile);
    const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf8')) as ChapterContent;
    
    console.log(`Processing ${bookSlug} chapter ${chapterData.chapter}`);
    
    // Process each verse in the content
    for (const item of chapterData.content) {
      const keys = Object.keys(item);
      const key = keys[0];
      
      // Skip heading entries
      if (key === 'heading') continue;
      
      // Parse verse number and text
      const verseNumber = parseInt(key);
      const text = item[key];
      
      if (isNaN(verseNumber)) {
        console.warn(`Skipping invalid verse number: ${key} in ${bookSlug} chapter ${chapterData.chapter}`);
        continue;
      }
      
      // Upsert the verse
      await prisma.verse.upsert({
        where: {
          versionId_chapterId_verseNumber: {
            versionId: versionId,
            chapterId: chapterId,
            verseNumber: verseNumber
          }
        },
        update: { text },
        create: {
          versionId: versionId,
          chapterId: chapterId,
          verseNumber: verseNumber,
          text
        }
      });
    }
    
    console.log(`Processed ${bookSlug} chapter ${chapterData.chapter}`);
  } catch (error) {
    console.error(`Error processing chapter ${chapterFile} in ${bookSlug}:`, error);
  }
}

async function processBook(
  languageCode: string,
  bookSlug: string,
  versionId: number
): Promise<void> {
  try {
    const bookPath = path.join(process.cwd(), 'data', languageCode, bookSlug);
    
    // Skip if not a directory
    if (!fs.statSync(bookPath).isDirectory()) {
      return;
    }
    
    console.log(`Processing book: ${bookSlug}`);
    
    // Get book name and number
    let bookName = bookNameMap[bookSlug] || bookSlug;
    let bookNumber = bookNumberMap[bookSlug] || 0;
    
    // Try to read the first chapter to get book info if not in map
    if (!bookNameMap[bookSlug]) {
      const chapters = fs.readdirSync(bookPath).filter(file => file.endsWith('.json'));
      if (chapters.length > 0) {
        const firstChapterPath = path.join(bookPath, chapters[0]);
        const chapterData = JSON.parse(fs.readFileSync(firstChapterPath, 'utf8')) as ChapterContent;
        bookName = chapterData.book || bookSlug;
      }
    }
    
    // Upsert the book
    const book = await prisma.book.upsert({
      where: { slug: bookSlug },
      update: { name: bookName, number: bookNumber },
      create: { name: bookName, slug: bookSlug, number: bookNumber }
    });
    
    // Process each chapter file
    const chapterFiles = fs.readdirSync(bookPath)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        const aNum = parseInt(a.replace('.json', ''));
        const bNum = parseInt(b.replace('.json', ''));
        return aNum - bNum;
      });
    
    for (const chapterFile of chapterFiles) {
      const chapterNum = parseInt(chapterFile.replace('.json', ''));
      
      // Upsert the chapter
      const chapter = await prisma.chapter.upsert({
        where: {
          bookId_chapterNum: {
            bookId: book.id,
            chapterNum: chapterNum
          }
        },
        update: {},
        create: {
          bookId: book.id,
          chapterNum: chapterNum
        }
      });
      
      await processChapter(languageCode, bookSlug, chapterFile, versionId, book.id, chapter.id);
    }
    
    console.log(`Completed processing book: ${bookSlug}`);
  } catch (error) {
    console.error(`Error processing book ${bookSlug}:`, error);
  }
}

async function processLanguage(languageCode: string): Promise<void> {
  try {
    const languagePath = path.join(process.cwd(), 'data', languageCode);
    
    // Skip if not a directory
    if (!fs.statSync(languagePath).isDirectory()) {
      return;
    }
    
    console.log(`Processing language: ${languageCode}`);
    
    // Get language and version info
    const languageName = languageNameMap[languageCode] || languageCode;
    const versionInfo = versionMap[languageCode] || { 
      code: languageCode.toUpperCase(), 
      name: languageCode 
    };
    
    // Upsert the language
    const language = await prisma.language.upsert({
      where: { code: languageCode },
      update: { name: languageName },
      create: { code: languageCode, name: languageName }
    });
    
    // Upsert the version
    const version = await prisma.version.upsert({
      where: { code: versionInfo.code },
      update: { name: versionInfo.name, languageId: language.id },
      create: { 
        code: versionInfo.code, 
        name: versionInfo.name, 
        languageId: language.id 
      }
    });
    
    // Process each book directory
    const bookSlugs = fs.readdirSync(languagePath)
      .filter(file => {
        const fullPath = path.join(languagePath, file);
        return fs.statSync(fullPath).isDirectory();
      });
    
    for (const bookSlug of bookSlugs) {
      await processBook(languageCode, bookSlug, version.id);
    }
    
    console.log(`Completed processing language: ${languageCode}`);
  } catch (error) {
    console.error(`Error processing language ${languageCode}:`, error);
  }
}

async function main() {
  console.log('Starting Bible data loading from folders...');

  // Get language code from command line argument
  const languageCode = process.argv[2];
  if (!languageCode) {
    console.error('Error: Language code not provided.');
    console.log('Usage: npx ts-node scripts/load-folder-data.ts [language_code]');
    process.exit(1);
  }

  try {
    await processLanguage(languageCode);
    console.log('Bible data loading completed successfully!');
  } catch (error) {
    console.error('Error loading Bible data:', error);
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