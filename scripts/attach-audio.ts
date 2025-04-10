/**
 * Script for attaching audio files to existing verses in the database
 * 
 * Usage: npx ts-node scripts/attach-audio.ts <path-to-audio-json-file>
 * 
 * Example audio JSON format:
 * [
 *   {
 *     "versionCode": "RONGBSI",
 *     "bookSlug": "john",
 *     "chapterNum": 1,
 *     "verseNumber": 1,
 *     "audio": {
 *       "language": "ruanglat",
 *       "url": "https://example.com/audio/john/1-1.mp3",
 *       "duration": 5,
 *       "format": "mp3"
 *     }
 *   }
 * ]
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Create a Prisma client instance
const prisma = new PrismaClient();

interface AudioData {
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

// Function to attach a single audio file to a verse
async function attachAudio(audioData: AudioData): Promise<boolean> {
  try {
    // Find the verse ID based on the provided parameters
    const verse = await prisma.verse.findFirst({
      where: {
        version: {
          code: audioData.versionCode
        },
        chapter: {
          chapterNum: audioData.chapterNum,
          book: {
            slug: audioData.bookSlug
          }
        },
        verseNumber: audioData.verseNumber
      },
      select: {
        id: true
      }
    });

    if (!verse) {
      console.error(`Verse not found: ${audioData.bookSlug} ${audioData.chapterNum}:${audioData.verseNumber} (${audioData.versionCode})`);
      return false;
    }

    // Create the audio record linked to the verse
    await prisma.audio.create({
      data: {
        verseId: verse.id,
        language: audioData.audio.language,
        url: audioData.audio.url,
        duration: audioData.audio.duration,
        format: audioData.audio.format
      }
    });

    console.log(`Audio attached to ${audioData.bookSlug} ${audioData.chapterNum}:${audioData.verseNumber} (${audioData.versionCode})`);
    return true;
  } catch (error) {
    console.error(`Error attaching audio to ${audioData.bookSlug} ${audioData.chapterNum}:${audioData.verseNumber}:`, error);
    return false;
  }
}

// Main function to process the audio JSON file
async function main() {
  console.log('Starting audio attachment process...');

  // Get file path from command line argument
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Error: Audio JSON file path not provided.');
    console.log('Usage: npx ts-node scripts/attach-audio.ts <path-to-audio-json-file>');
    process.exit(1);
  }

  try {
    // Read and parse the audio JSON file
    const audioDataArray: AudioData[] = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
    
    if (!Array.isArray(audioDataArray)) {
      throw new Error('Invalid audio data format. Expected an array of audio entries.');
    }

    console.log(`Processing ${audioDataArray.length} audio entries...`);

    // Process each audio entry
    let successCount = 0;
    let failureCount = 0;

    for (const audioData of audioDataArray) {
      const success = await attachAudio(audioData);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    console.log('Audio attachment process completed.');
    console.log(`Successfully attached: ${successCount}`);
    console.log(`Failed to attach: ${failureCount}`);

  } catch (error) {
    console.error('Error processing audio data:', error);
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