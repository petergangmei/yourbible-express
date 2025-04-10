"use strict";
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
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Create a Prisma client instance
const prisma = new client_1.PrismaClient();
// Function to attach a single audio file to a verse
function attachAudio(audioData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Find the verse ID based on the provided parameters
            const verse = yield prisma.verse.findFirst({
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
            yield prisma.audio.create({
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
        }
        catch (error) {
            console.error(`Error attaching audio to ${audioData.bookSlug} ${audioData.chapterNum}:${audioData.verseNumber}:`, error);
            return false;
        }
    });
}
// Main function to process the audio JSON file
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const audioDataArray = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(filePath), 'utf8'));
            if (!Array.isArray(audioDataArray)) {
                throw new Error('Invalid audio data format. Expected an array of audio entries.');
            }
            console.log(`Processing ${audioDataArray.length} audio entries...`);
            // Process each audio entry
            let successCount = 0;
            let failureCount = 0;
            for (const audioData of audioDataArray) {
                const success = yield attachAudio(audioData);
                if (success) {
                    successCount++;
                }
                else {
                    failureCount++;
                }
            }
            console.log('Audio attachment process completed.');
            console.log(`Successfully attached: ${successCount}`);
            console.log(`Failed to attach: ${failureCount}`);
        }
        catch (error) {
            console.error('Error processing audio data:', error);
            process.exit(1);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
// Execute the main function
main()
    .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
