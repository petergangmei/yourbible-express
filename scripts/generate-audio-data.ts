/**
 * Script to generate audio attachment data for the folder-based Bible data
 * 
 * This script helps create a JSON file in the format required by attach-audio.ts
 * for verses that were loaded using the folder structure approach.
 * 
 * Usage: npx ts-node scripts/generate-audio-data.ts [language_code] [output_path]
 * Example: npx ts-node scripts/generate-audio-data.ts rongbsi data/rongbsi-audio.json
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map language codes to version codes 
const versionMap: Record<string, string> = {
  'ruanglat': 'RONGBSI',
  // Add more languages as needed
};

interface ChapterContent {
  book: string;
  slug: string;
  chapter: number;
  language: string;
  content: Array<Record<string, string>>;
}

interface AudioAttachment {
  versionCode: string;
  bookSlug: string;
  chapterNum: number;
  verseNumber: number;
  audio: {
    language: string;
    url: string;
    duration?: number;
    format?: string;
  };
}

async function generateAudioData(languageCode: string, outputPath: string): Promise<void> {
  try {
    const versionCode = versionMap[languageCode] || languageCode.toUpperCase();
    const audioAttachments: AudioAttachment[] = [];
    const languagePath = path.join(process.cwd(), 'data', languageCode);
    
    // Get all book directories
    const bookSlugs = fs.readdirSync(languagePath)
      .filter(file => {
        const fullPath = path.join(languagePath, file);
        return fs.statSync(fullPath).isDirectory();
      });
    
    for (const bookSlug of bookSlugs) {
      const bookPath = path.join(languagePath, bookSlug);
      
      // Get all chapter files
      const chapterFiles = fs.readdirSync(bookPath)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
          const aNum = parseInt(a.replace('.json', ''));
          const bNum = parseInt(b.replace('.json', ''));
          return aNum - bNum;
        });
      
      for (const chapterFile of chapterFiles) {
        const chapterPath = path.join(bookPath, chapterFile);
        const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf8')) as ChapterContent;
        const chapterNum = chapterData.chapter;
        
        // Process each verse in the content
        for (const item of chapterData.content) {
          const keys = Object.keys(item);
          const key = keys[0];
          
          // Skip heading entries
          if (key === 'heading') continue;
          
          // Parse verse number
          const verseNumber = parseInt(key);
          
          if (isNaN(verseNumber)) continue;
          
          // Create audio attachment (example pattern)
          const audioFilename = `${bookSlug}_${chapterNum}_${verseNumber}.mp3`;
          const audioAttachment: AudioAttachment = {
            versionCode,
            bookSlug,
            chapterNum,
            verseNumber,
            audio: {
              language: languageCode,
              url: `https://example.com/audio/${bookSlug}/${chapterNum}/${verseNumber}.mp3`,
              duration: 5, // placeholder
              format: 'mp3'
            }
          };
          
          audioAttachments.push(audioAttachment);
        }
      }
    }
    
    // Write audio attachments to file
    fs.writeFileSync(outputPath, JSON.stringify(audioAttachments, null, 2));
    console.log(`Generated audio attachment data for ${audioAttachments.length} verses`);
    console.log(`Output written to ${outputPath}`);
    
  } catch (error) {
    console.error('Error generating audio data:', error);
    process.exit(1);
  }
}

async function main() {
  // Get language code and output path from command line argument
  const languageCode = process.argv[2];
  const outputPath = process.argv[3];
  
  if (!languageCode || !outputPath) {
    console.error('Error: Missing arguments.');
    console.log('Usage: npx ts-node scripts/generate-audio-data.ts [language_code] [output_path]');
    process.exit(1);
  }

  try {
    await generateAudioData(languageCode, outputPath);
  } catch (error) {
    console.error('Error:', error);
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