"use strict";
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
// Map book slugs to book numbers (order in the Bible)
const bookNumberMap = {
    'thaureymei': 1, // Genesis
    'tatpatmei': 2, // Exodus
    // Add more books as needed with their respective order numbers
};
// Map book slugs to English names
const bookNameMap = {
    'thaureymei': 'Genesis',
    'tatpatmei': 'Exodus',
    // Add more books as needed
};
// Map language codes to language names
const languageNameMap = {
    'ruanglat': 'Rongmei',
    // Add more languages as needed
};
// Map language codes to version codes and names
const versionMap = {
    'ruanglat': { code: 'RONGBSI', name: 'Rongmei Bible Society India' },
    // Add more versions as needed
};
function processChapter(languageCode, bookSlug, chapterFile, versionId, bookId, chapterId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chapterPath = path_1.default.join(process.cwd(), 'data', languageCode, bookSlug, chapterFile);
            const chapterData = JSON.parse(fs_1.default.readFileSync(chapterPath, 'utf8'));
            console.log(`Processing ${bookSlug} chapter ${chapterData.chapter}`);
            // Process each verse in the content
            for (const item of chapterData.content) {
                const keys = Object.keys(item);
                const key = keys[0];
                // Skip heading entries
                if (key === 'heading')
                    continue;
                // Parse verse number and text
                const verseNumber = parseInt(key);
                const text = item[key];
                if (isNaN(verseNumber)) {
                    console.warn(`Skipping invalid verse number: ${key} in ${bookSlug} chapter ${chapterData.chapter}`);
                    continue;
                }
                // Upsert the verse
                yield prisma.verse.upsert({
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
        }
        catch (error) {
            console.error(`Error processing chapter ${chapterFile} in ${bookSlug}:`, error);
        }
    });
}
function processBook(languageCode, bookSlug, versionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const bookPath = path_1.default.join(process.cwd(), 'data', languageCode, bookSlug);
            // Skip if not a directory
            if (!fs_1.default.statSync(bookPath).isDirectory()) {
                return;
            }
            console.log(`Processing book: ${bookSlug}`);
            // Get book name and number
            let bookName = bookNameMap[bookSlug] || bookSlug;
            let bookNumber = bookNumberMap[bookSlug] || 0;
            // Try to read the first chapter to get book info if not in map
            if (!bookNameMap[bookSlug]) {
                const chapters = fs_1.default.readdirSync(bookPath).filter(file => file.endsWith('.json'));
                if (chapters.length > 0) {
                    const firstChapterPath = path_1.default.join(bookPath, chapters[0]);
                    const chapterData = JSON.parse(fs_1.default.readFileSync(firstChapterPath, 'utf8'));
                    bookName = chapterData.book || bookSlug;
                }
            }
            // Upsert the book
            const book = yield prisma.book.upsert({
                where: { slug: bookSlug },
                update: { name: bookName, number: bookNumber },
                create: { name: bookName, slug: bookSlug, number: bookNumber }
            });
            // Process each chapter file
            const chapterFiles = fs_1.default.readdirSync(bookPath)
                .filter(file => file.endsWith('.json'))
                .sort((a, b) => {
                const aNum = parseInt(a.replace('.json', ''));
                const bNum = parseInt(b.replace('.json', ''));
                return aNum - bNum;
            });
            for (const chapterFile of chapterFiles) {
                const chapterNum = parseInt(chapterFile.replace('.json', ''));
                // Upsert the chapter
                const chapter = yield prisma.chapter.upsert({
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
                yield processChapter(languageCode, bookSlug, chapterFile, versionId, book.id, chapter.id);
            }
            console.log(`Completed processing book: ${bookSlug}`);
        }
        catch (error) {
            console.error(`Error processing book ${bookSlug}:`, error);
        }
    });
}
function processLanguage(languageCode) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const languagePath = path_1.default.join(process.cwd(), 'data', languageCode);
            // Skip if not a directory
            if (!fs_1.default.statSync(languagePath).isDirectory()) {
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
            const language = yield prisma.language.upsert({
                where: { code: languageCode },
                update: { name: languageName },
                create: { code: languageCode, name: languageName }
            });
            // Upsert the version
            const version = yield prisma.version.upsert({
                where: { code: versionInfo.code },
                update: { name: versionInfo.name, languageId: language.id },
                create: {
                    code: versionInfo.code,
                    name: versionInfo.name,
                    languageId: language.id
                }
            });
            // Process each book directory
            const bookSlugs = fs_1.default.readdirSync(languagePath)
                .filter(file => {
                const fullPath = path_1.default.join(languagePath, file);
                return fs_1.default.statSync(fullPath).isDirectory();
            });
            for (const bookSlug of bookSlugs) {
                yield processBook(languageCode, bookSlug, version.id);
            }
            console.log(`Completed processing language: ${languageCode}`);
        }
        catch (error) {
            console.error(`Error processing language ${languageCode}:`, error);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting Bible data loading from folders...');
        // Get language code from command line argument
        const languageCode = process.argv[2];
        if (!languageCode) {
            console.error('Error: Language code not provided.');
            console.log('Usage: npx ts-node scripts/load-folder-data.ts [language_code]');
            process.exit(1);
        }
        try {
            yield processLanguage(languageCode);
            console.log('Bible data loading completed successfully!');
        }
        catch (error) {
            console.error('Error loading Bible data:', error);
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
