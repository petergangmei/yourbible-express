# Bible App Backend

An open-source Express.js backend powered by Prisma and PostgreSQL for a multi-lingual Bible application. This project provides a RESTful API that delivers Bible text organized into books, chapters, and verses, along with future support for audio content attachment per verse.

The API is designed for offline-capable client applications (e.g., React Native), ensuring efficient delivery of a full Bible dataset with complete hierarchies and language/version-specific content.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Data Ingestion & Seeding](#data-ingestion--seeding)
- [Contributing](#contributing)
- [License](#license)
- [Future Enhancements](#future-enhancements)

## Features

- **Multi-Language Support:** Query Bible texts based on language code.
- **Multi-Version Support:** Handle different Bible translations (e.g., NIV, KJV, RONGBSI).
- **Hierarchical Data Structure:** Organized as Books → Chapters → Verses.
- **Audio Integration:** Flexible design to attach multiple audio files per verse. (Audio support can be added or updated in the future.)
- **Offline Capability:** Designed to deliver full Bible datasets for use in offline mobile applications.
- **Open-Source:** Join our community to enhance the Bible App backend with new features and improvements.

## Tech Stack

- **Backend Framework:** [Express.js](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Language:** TypeScript/JavaScript (Feel free to adapt based on your preferred flavor)

## Architecture

The backend is organized into a modular Express application with the following key elements:

1. **Database Schema (Prisma Models):**
   - **Language:** Represents available languages.
   - **Version:** Holds Bible translations linked to a language.
   - **Book:** Contains Bible books (with metadata such as slug and order).
   - **Chapter:** Represents chapters belonging to a book.
   - **Verse:** Stores verse text and is linked to chapters and versions.
   - **Audio:** (Future ready) Associates one or more audio files to each verse, including metadata such as URL, format, and duration.

2. **API Endpoints:**
   - **GET `/bible/:languageCode`:** Returns a full hierarchical Bible dataset (books, chapters, verses) along with any associated audio metadata.

3. **Data Ingestion:**
   - Supports importing Bible JSON data structured in a way that can be seeded into the database using a custom parser/seed script.

## Getting Started

### Prerequisites

- Node.js (v14 or above)
- npm or yarn
- PostgreSQL (configured with a user/database for the project)
- Git

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/bible-app-backend.git
   cd bible-app-backend
