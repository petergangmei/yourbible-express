"use strict";
/**
 * Script for validating Bible data format before seeding
 *
 * Usage: npx ts-node scripts/validate-data.ts <path-to-bible-json-file>
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
function validateAudio(audio, path) {
    const errors = [];
    if (!audio.language)
        errors.push(`${path}: Audio missing language`);
    if (!audio.url)
        errors.push(`${path}: Audio missing url`);
    return errors;
}
function validateVerse(verse, path) {
    const errors = [];
    if (verse.verseNumber === undefined)
        errors.push(`${path}: Verse missing verseNumber`);
    if (!verse.text)
        errors.push(`${path}: Verse missing text`);
    if (verse.audios && Array.isArray(verse.audios)) {
        verse.audios.forEach((audio, i) => {
            errors.push(...validateAudio(audio, `${path}.audios[${i}]`));
        });
    }
    return errors;
}
function validateChapter(chapter, path) {
    const errors = [];
    if (chapter.chapterNum === undefined)
        errors.push(`${path}: Chapter missing chapterNum`);
    if (!chapter.verses || !Array.isArray(chapter.verses)) {
        errors.push(`${path}: Chapter missing verses array`);
    }
    else {
        chapter.verses.forEach((verse, i) => {
            errors.push(...validateVerse(verse, `${path}.verses[${i}]`));
        });
    }
    return errors;
}
function validateBook(book, path) {
    const errors = [];
    if (!book.name)
        errors.push(`${path}: Book missing name`);
    if (!book.slug)
        errors.push(`${path}: Book missing slug`);
    if (book.number === undefined)
        errors.push(`${path}: Book missing number`);
    if (!book.chapters || !Array.isArray(book.chapters)) {
        errors.push(`${path}: Book missing chapters array`);
    }
    else {
        book.chapters.forEach((chapter, i) => {
            errors.push(...validateChapter(chapter, `${path}.chapters[${i}]`));
        });
    }
    return errors;
}
function validateBibleData(data) {
    const errors = [];
    // Check language
    if (!data.language) {
        errors.push('Missing language object');
    }
    else {
        if (!data.language.code)
            errors.push('Language missing code');
        if (!data.language.name)
            errors.push('Language missing name');
    }
    // Check version
    if (!data.version) {
        errors.push('Missing version object');
    }
    else {
        if (!data.version.code)
            errors.push('Version missing code');
        if (!data.version.name)
            errors.push('Version missing name');
    }
    // Check books
    if (!data.books || !Array.isArray(data.books)) {
        errors.push('Missing books array');
    }
    else {
        data.books.forEach((book, i) => {
            errors.push(...validateBook(book, `books[${i}]`));
        });
    }
    return errors;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const bibleData = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(filePath), 'utf8'));
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
            bibleData.books.forEach((book) => {
                book.chapters.forEach((chapter) => {
                    totalVerses += chapter.verses.length;
                    chapter.verses.forEach((verse) => {
                        if (verse.audios) {
                            totalAudioFiles += verse.audios.length;
                        }
                    });
                });
            });
            console.log(`Total verses: ${totalVerses}`);
            console.log(`Total audio files: ${totalAudioFiles}`);
        }
        catch (error) {
            console.error('Error processing Bible data:', error);
            process.exit(1);
        }
    });
}
// Execute the main function
main()
    .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
