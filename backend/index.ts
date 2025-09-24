import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import registrationRoutes from './src/routes/registration';
import authRoutes from './src/routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Alternative dev port
      process.env.FRONTEND_URL, // Environment variable for frontend URL
      // Allow all origins in development for easier testing
      ...(NODE_ENV === 'development' ? ['*'] : [])
    ].filter(Boolean); // Remove any undefined values

    // Check if origin is in allowed list or if we're in development
    const isAllowed = allowedOrigins.includes('*') ||
                     allowedOrigins.includes(origin);

    if (isAllowed) {
      if (NODE_ENV === 'development') {
        console.log(`✅ CORS allowed for origin: ${origin}`);
      }
      callback(null, true);
    } else {
      console.log('❌ Blocked CORS request from origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/auth', authRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads'), {
  maxAge: NODE_ENV === 'production' ? '1d' : '0', // Cache for 1 day in production
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Set proper MIME types for different file types
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    }

    if (NODE_ENV === 'production') {
      // Add security headers for production
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }
  }
}));

// Health check endpoint
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    storage: 'JSON File + Cloudinary',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Error occurred:', err);

  // Don't expose stack traces in production
  const errorMessage = NODE_ENV === 'development' ? err.message : 'Something went wrong!';

  res.status(err.status || 500).json({
    error: errorMessage,
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in production, just log the error
  if (NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit the process in production, just log the error
  if (NODE_ENV === 'development') {
    process.exit(1);
  }
});

// 404 handler for all routes
app.use((req: express.Request, res: express.Response) => {
  // Only handle API routes and static files
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ error: 'Route not found' });
  }

  // For production, return a proper error message
  if (NODE_ENV === 'production') {
    return res.status(404).json({
      error: 'Page not found',
      message: 'This is the backend API server. Please visit the frontend application.',
      frontend_url: process.env.FRONTEND_URL || 'https://your-frontend-app.onrender.com'
    });
  }

  // For development, serve a simple message
  return res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>This is the backend API server running on port ${PORT}.</p>
    <p>Frontend is likely running on <a href="http://localhost:5173">http://localhost:5173</a></p>
    <p>API endpoints are available at <a href="/api/health">/api/health</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📊 Log Level: ${LOG_LEVEL}`);
  console.log(`💾 Storage: JSON File + Cloudinary`);
  console.log(`✅ No database required - using file-based storage`);
  console.log(`⚡ TypeScript: Enabled`);

  if (NODE_ENV === 'production') {
    console.log('🔒 Production mode: Enhanced security and performance optimizations enabled');
  } else {
    console.log('🔧 Development mode: Debug logging and relaxed CORS enabled');
  }
});
