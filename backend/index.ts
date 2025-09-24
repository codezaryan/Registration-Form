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
      process.env.FRONTEND_URL, // Environment variable for frontend URL
      ...(NODE_ENV === 'development' ? ['*'] : [])
    ].filter(Boolean); // Remove any undefined values

    // Check if origin is in allowed list or if we're in development
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
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

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Routes
app.use('/api/registrations', registrationRoutes);
app.use('/api/auth', authRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

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
  if (NODE_ENV === 'development') {
    console.error('🚨 Error occurred:', err.stack);
  } else {
    console.error('🚨 Error occurred:', err.message);
  }

  res.status(500).json({
    error: NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
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
