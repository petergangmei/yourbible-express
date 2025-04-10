# YourBible.in API

An open-source Express.js backend powered by Prisma and PostgreSQL for a multi-lingual Bible application. This project provides a RESTful API that delivers Bible text organized into books, chapters, and verses, along with support for audio content attachment per verse.

The API is designed for offline-capable client applications (e.g., React Native), ensuring efficient delivery of a full Bible dataset with complete hierarchies and language/version-specific content.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Data Ingestion](#data-ingestion)
  - [Audio Attachments](#audio-attachments)
  - [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Known Issues & Solutions](#known-issues-solutions)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Multi-Language Support:** Query Bible texts based on language code.
- **Multi-Version Support:** Handle different Bible translations (e.g., NIV, KJV, RONGBSI).
- **Hierarchical Data Structure:** Organized as Books → Chapters → Verses.
- **Audio Integration:** Flexible design to attach multiple audio files per verse.
- **Offline Capability:** Designed to deliver full Bible datasets for use in offline mobile applications.

## Tech Stack

- **Backend Framework:** [Express.js](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Language:** TypeScript

## Architecture

The backend is organized into a modular Express application with the following key elements:

1. **Database Schema (Prisma Models):**
   - **Language:** Represents available languages.
   - **Version:** Holds Bible translations linked to a language.
   - **Book:** Contains Bible books (with metadata such as slug and order).
   - **Chapter:** Represents chapters belonging to a book.
   - **Verse:** Stores verse text and is linked to chapters and versions.
   - **Audio:** Associates one or more audio files to each verse, including metadata such as URL, format, and duration.

2. **API Endpoints:**
   - **GET `/bible/:languageCode`:** Returns a full hierarchical Bible dataset (books, chapters, verses) along with any associated audio metadata.

## Getting Started

### Prerequisites

- Node.js (v14 or above)
- npm or yarn
- PostgreSQL database
- Git

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/yourbible.in.git
   cd yourbible.in
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**

   Create a `.env` file in the root directory with the following variables:

   ```
   # Database Configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/yourbible?schema=public"

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security
   CORS_ORIGIN="*"
   ```

   Replace the `DATABASE_URL` with your actual PostgreSQL connection string.

### Database Setup

1. **Create the Database:**

   Ensure your PostgreSQL server is running, then create a new database named `yourbible` (or whatever you specified in your connection string).

2. **Run Migrations:**

   ```bash
   npm run prisma:migrate
   ```

3. **Generate Prisma Client:**

   ```bash
   npm run prisma:generate
   ```

### Data Ingestion

The project includes several tools for data ingestion and management:

1. **Validate Bible Data:**

   Before seeding, you can validate your Bible data JSON file format:

   ```bash
   npm run validate path/to/your-bible-data.json
   ```

   This script checks if the Bible data follows the expected format and structure.

2. **Seed Bible Data:**

   After validation, seed the database with your Bible data:

   ```bash
   npm run seed path/to/your-bible-data.json
   ```

   The expected JSON format is:

   ```json
   {
     "language": {
       "code": "en",
       "name": "English"
     },
     "version": {
       "code": "KJV",
       "name": "King James Version"
     },
     "books": [
       {
         "name": "Genesis",
         "slug": "genesis",
         "number": 1,
         "chapters": [
           {
             "chapterNum": 1,
             "verses": [
               {
                 "verseNumber": 1,
                 "text": "In the beginning God created the heaven and the earth.",
                 "audios": [
                   {
                     "language": "en",
                     "url": "https://example.com/audio/gen/1-1.mp3",
                     "duration": 5,
                     "format": "mp3"
                   }
                 ]
               }
             ]
           }
         ]
       }
     ]
   }
   ```

   You can include audio attachments directly in the Bible data file or add them later.

3. **Load Bible Data from Folder Structure:**

   Alternatively, you can load Bible data organized in folders:

   ```bash
   npm run load-folder [language_code]
   ```

   For example:
   ```bash
   npm run load-folder rongbsi
   ```

   The expected folder structure is:
   ```
   /data
     /[language_code] (e.g., rongbsi)
       /[book_slug] (e.g., genesis)
         /1.json (chapter 1)
         /2.json (chapter 2)
         ...
   ```

   Each chapter JSON file should follow this format:
   ```json
   {
     "book": "THAUREYMEI",
     "slug": "thaureymei",
     "chapter": 1,
     "language": "ruanglat",
     "content": [
       { "heading": "Chapter Title" },
       { "1": "Verse text for verse 1" },
       { "2": "Verse text for verse 2" }
     ]
   }
   ```

### Audio Attachments

Audio files can be attached to existing verses in two ways:

1. **During Initial Seeding:**
   
   Include the `audios` array for each verse in your Bible data JSON file.

2. **Separate Audio Attachment:**

   For attaching audio files to existing verses after initial seeding:

   ```bash
   npm run attach-audio path/to/audio-attachments.json
   ```

   The audio attachments file should have the following format:

   ```json
   [
     {
       "versionCode": "KJV",
       "bookSlug": "john",
       "chapterNum": 1,
       "verseNumber": 1,
       "audio": {
         "language": "en",
         "url": "https://example.com/audio/john/1-1.mp3",
         "duration": 5,
         "format": "mp3"
       }
     }
   ]
   ```

   This approach is useful for:
   - Adding audio files in batches
   - Managing audio files separately from text content
   - Updating existing audio files

3. **Generate Audio Data for Folder-Based Bible Data:**

   If you've loaded Bible data using the folder structure approach, you can generate an audio attachment file:

   ```bash
   npm run generate-audio [language_code] [output_path]
   ```

   For example:
   ```bash
   npm run generate-audio rongbsi data/rongbsi-audio.json
   ```

   This will create a JSON file with audio entries for each verse, which you can then edit to include actual audio URLs.
   After editing the file, you can attach the audio files:

   ```bash
   npm run attach-audio data/rongbsi-audio.json
   ```

### Running the Server

1. **Development Mode:**

   ```bash
   npm run dev
   ```

2. **Production Mode:**

   ```bash
   npm run build
   npm start
   ```

The server will start on the port specified in your `.env` file (default: 3000).

## API Documentation

The API is documented using Swagger UI. Once the server is running, you can access the documentation at:

- `http://localhost:3000/api-docs` 

The following endpoints are available:

- `GET /bible/language/:languageCode` - Retrieve Bible data for a specific language
- `GET /bible/version/:versionCode` - Retrieve Bible data for a specific version
- `GET /bible/version/:versionCode/book/:bookSlug` - Retrieve a specific book
- `GET /bible/version/:versionCode/book/:bookSlug/chapter/:chapterNum` - Retrieve a specific chapter
- `GET /bible/version/:versionCode/book/:bookSlug/chapter/:chapterNum/verse/:verseNum` - Retrieve a specific verse
- `GET /bible/search?query=text` - Search for verses containing specific text

## Known Issues & Solutions

### Database Schema Management

When using a shared database that already contains tables (e.g., from Django or other applications), you may encounter schema conflicts. Here are solutions:

1. **Use a Schema Parameter**: Add `?schema=bible_api` to your PostgreSQL connection URL in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=bible_api"
   ```
   This will create tables in a separate schema to avoid conflicts.

2. **Run Migrations in Create-Only Mode First**: 
   ```bash
   npx prisma migrate dev --name init --create-only
   ```
   This allows you to review migrations before applying them.

3. **Database Reset Alternative**: If you need a clean slate and have permission, you can reset the schema:
   ```bash
   npx prisma migrate reset --schema-only
   ```
   (Only use this if you understand the implications)

### Troubleshooting Connection Issues

If you encounter database connection issues:

1. Verify the DATABASE_URL in your `.env` file
2. Ensure the database user has appropriate permissions
3. Check if the database server allows connections from your IP
4. Validate that appropriate schemas exist or can be created by your user

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.
