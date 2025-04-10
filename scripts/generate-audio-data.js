"use strict";
/**
 * Script to generate audio attachment data for the folder-based Bible data
 *
 * This script helps create a JSON file in the format required by attach-audio.ts
 * for verses that were loaded using the folder structure approach.
 *
 * Usage: npx ts-node scripts/generate-audio-data.ts [language_code] [output_path]
 * Example: npx ts-node scripts/generate-audio-data.ts rongbsi data/rongbsi-audio.json
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Map language codes to version codes 
const versionMap = {
    'ruanglat': 'RONGBSI',
    // Add more languages as needed
};
function generateAudioData(languageCode, outputPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const versionCode = versionMap[languageCode] || languageCode.toUpperCase();
            const audioAttachments = [];
            const languagePath = path_1.default.join(process.cwd(), 'data', languageCode);
            // Get all book directories
            const bookSlugs = fs_1.default.readdirSync(languagePath)
                .filter(file => {
                const fullPath = path_1.default.join(languagePath, file);
                return fs_1.default.statSync(fullPath).isDirectory();
            });
            for (const bookSlug of bookSlugs) {
                const bookPath = path_1.default.join(languagePath, bookSlug);
                // Get all chapter files
                const chapterFiles = fs_1.default.readdirSync(bookPath)
                    .filter(file => file.endsWith('.json'))
                    .sort((a, b) => {
                    const aNum = parseInt(a.replace('.json', ''));
                    const bNum = parseInt(b.replace('.json', ''));
                    return aNum - bNum;
                });
                for (const chapterFile of chapterFiles) {
                    const chapterPath = path_1.default.join(bookPath, chapterFile);
                    const chapterData = JSON.parse(fs_1.default.readFileSync(chapterPath, 'utf8'));
                    const chapterNum = chapterData.chapter;
                    // Process each verse in the content
                    for (const item of chapterData.content) {
                        const keys = Object.keys(item);
                        const key = keys[0];
                        // Skip heading entries
                        if (key === 'heading')
                            continue;
                        // Parse verse number
                        const verseNumber = parseInt(key);
                        if (isNaN(verseNumber))
                            continue;
                        // Create audio attachment (example pattern)
                        const audioFilename = `${bookSlug}_${chapterNum}_${verseNumber}.mp3`;
                        const audioAttachment = {
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
            fs_1.default.writeFileSync(outputPath, JSON.stringify(audioAttachments, null, 2));
            console.log(`Generated audio attachment data for ${audioAttachments.length} verses`);
            console.log(`Output written to ${outputPath}`);
        }
        catch (error) {
            console.error('Error generating audio data:', error);
            process.exit(1);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Get language code and output path from command line argument
        const languageCode = process.argv[2];
        const outputPath = process.argv[3];
        if (!languageCode || !outputPath) {
            console.error('Error: Missing arguments.');
            console.log('Usage: npx ts-node scripts/generate-audio-data.ts [language_code] [output_path]');
            process.exit(1);
        }
        try {
            yield generateAudioData(languageCode, outputPath);
        }
        catch (error) {
            console.error('Error:', error);
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
