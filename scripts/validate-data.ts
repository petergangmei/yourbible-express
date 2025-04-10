/**
 * Script for validating Bible data format before seeding
 * 
 * Usage: npx ts-node scripts/validate-data.ts <path-to-bible-json-file>
 */

import fs from 'fs';
import path from 'path';

interface Audio {
  language: string;
  url: string;
  duration?: number;
  format?: string;
}

interface Verse {
  verseNumber: number;
  text: string;
  audios?: Audio[];
}

interface Chapter {
  chapterNum: number;
  verses: Verse[];
}

interface Book {
  name: string;
  slug: string;
  number: number;
  chapters: Chapter[];
}

interface Version {
  code: string;
  name: string;
}

interface Language {
  code: string;
  name: string;
}

interface BibleData {
  language: Language;
  version: Version;
  books: Book[];
}

function validateAudio(audio: any, path: string): string[] {
  const errors: string[] = [];
  
  if (!audio.language) errors.push(`${path}: Audio missing language`);
  if (!audio.url) errors.push(`${path}: Audio missing url`);
  
  return errors;
}

function validateVerse(verse: any, path: string): string[] {
  const errors: string[] = [];
  
  if (verse.verseNumber === undefined) errors.push(`${path}: Verse missing verseNumber`);
  if (!verse.text) errors.push(`${path}: Verse missing text`);
  
  if (verse.audios && Array.isArray(verse.audios)) {
    verse.audios.forEach((audio: any, i: number) => {
      errors.push(...validateAudio(audio, `${path}.audios[${i}]`));
    });
  }
  
  return errors;
}

function validateChapter(chapter: any, path: string): string[] {
  const errors: string[] = [];
  
  if (chapter.chapterNum === undefined) errors.push(`${path}: Chapter missing chapterNum`);
  
  if (!chapter.verses || !Array.isArray(chapter.verses)) {
    errors.push(`${path}: Chapter missing verses array`);
  } else {
    chapter.verses.forEach((verse: any, i: number) => {
      errors.push(...validateVerse(verse, `${path}.verses[${i}]`));
    });
  }
  
  return errors;
}

function validateBook(book: any, path: string): string[] {
  const errors: string[] = [];
  
  if (!book.name) errors.push(`${path}: Book missing name`);
  if (!book.slug) errors.push(`${path}: Book missing slug`);
  if (book.number === undefined) errors.push(`${path}: Book missing number`);
  
  if (!book.chapters || !Array.isArray(book.chapters)) {
    errors.push(`${path}: Book missing chapters array`);
  } else {
    book.chapters.forEach((chapter: any, i: number) => {
      errors.push(...validateChapter(chapter, `${path}.chapters[${i}]`));
    });
  }
  
  return errors;
}

function validateBibleData(data: any): string[] {
  const errors: string[] = [];
  
  // Check language
  if (!data.language) {
    errors.push('Missing language object');
  } else {
    if (!data.language.code) errors.push('Language missing code');
    if (!data.language.name) errors.push('Language missing name');
  }
  
  // Check version
  if (!data.version) {
    errors.push('Missing version object');
  } else {
    if (!data.version.code) errors.push('Version missing code');
    if (!data.version.name) errors.push('Version missing name');
  }
  
  // Check books
  if (!data.books || !Array.isArray(data.books)) {
    errors.push('Missing books array');
  } else {
    data.books.forEach((book: any, i: number) => {
      errors.push(...validateBook(book, `books[${i}]`));
    });
  }
  
  return errors;
}

async function main() {
  console.log('Validating Bible data format...');

  // Get file path from command line argument
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Error: Bible JSON file path not provided.');
    console.log('Usage: npx ts-node scripts/validate-data.ts <path-to-bible-json-file>');
    process.exit(1);
  }

  try {
    // Read and parse the Bible JSON file
    const bibleData = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8')) as BibleData;
    
    // Validate the data format
    const errors = validateBibleData(bibleData);
    
    if (errors.length > 0) {
      console.error('Validation failed with the following errors:');
      errors.forEach(error => console.error(`- ${error}`));
      process.exit(1);
    }
    
    console.log('Validation successful!');
    console.log(`Found ${bibleData.books.length} books in ${bibleData.version.name} (${bibleData.language.name})`);
    
    // Count verses and audio files
    let totalVerses = 0;
    let totalAudioFiles = 0;
    
    bibleData.books.forEach((book: Book) => {
      book.chapters.forEach((chapter: Chapter) => {
        totalVerses += chapter.verses.length;
        chapter.verses.forEach((verse: Verse) => {
          if (verse.audios) {
            totalAudioFiles += verse.audios.length;
          }
        });
      });
    });
    
    console.log(`Total verses: ${totalVerses}`);
    console.log(`Total audio files: ${totalAudioFiles}`);
    
  } catch (error) {
    console.error('Error processing Bible data:', error);
    process.exit(1);
  }
}

// Execute the main function
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 