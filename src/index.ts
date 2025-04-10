// Import required packages
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import routes
import bibleRoutes from './routes/bible';

// Import middleware
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware';

// Import utils
import { setupSwagger } from './utils/swagger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Prisma client
const prisma = new PrismaClient();

// Apply middleware
app.use(helmet()); // Secure HTTP headers
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Setup Swagger
setupSwagger(app);

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to YourBible.in API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      bible: '/bible',
      search: '/bible/search',
      language: '/bible/language/:languageCode',
      version: '/bible/version/:versionCode',
      book: '/bible/version/:versionCode/book/:bookSlug',
      chapter: '/bible/version/:versionCode/book/:bookSlug/chapter/:chapterNum',
      verse: '/bible/version/:versionCode/book/:bookSlug/chapter/:chapterNum/verse/:verseNum'
    }
  });
});

// Apply API routes
app.use('/bible', bibleRoutes);

// Apply error handling middleware
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Documentation: http://localhost:${port}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Export Prisma client for use in other files
export { prisma }; 