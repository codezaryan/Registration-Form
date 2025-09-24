# Registration Form Application

A full-stack registration system with separate development and production profiles.

## Features

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **File Storage**: JSON files + Cloudinary integration
- **Environment Management**: Separate dev/prod configurations

## Environment Setup

This application supports two environments: **development** and **production**. Each environment has its own configuration files.

### Quick Setup

1. **Set up the environment**:
   ```bash
   # For development (default)
   node setup-env.js development

   # For production
   node setup-env.js production
   ```

2. **Update environment variables**:
   - Edit `backend/.env` and `frontend/.env` with your specific values
   - For production, update the URLs in `.env.production` files

### Environment Variables

#### Backend (`.env`)
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend application URL
- `LOG_LEVEL`: Logging level (debug/info/warn/error)
- `CORS_ORIGIN`: Allowed CORS origins

#### Frontend (`.env`)
- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_APP_ENV`: Application environment

## Running the Application

### Development Mode
```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### Production Mode
```bash
# Backend
cd backend
npm run start:prod

# Frontend (in another terminal)
cd frontend
npm run dev:prod
```

### Alternative Commands

#### Backend
- `npm run dev` - Development mode with hot reload
- `npm run dev:prod` - Production mode with hot reload
- `npm run build` - Build for production
- `npm run start` - Start built application
- `npm run start:dev` - Start built application in development mode
- `npm run start:prod` - Start built application in production mode

#### Frontend
- `npm run dev` - Development mode
- `npm run dev:prod` - Production mode
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run preview` - Preview built application
- `npm run preview:prod` - Preview built application in production mode

## Environment-Specific Features

### Development Mode
- ✅ Hot reload enabled
- ✅ Debug logging
- ✅ Relaxed CORS (allows all origins)
- ✅ Detailed error messages
- ✅ Source maps enabled

### Production Mode
- ✅ Optimized build
- ✅ Minimal logging
- ✅ Strict CORS policy
- ✅ Generic error messages
- ✅ Minified code

## Project Structure

```
├── backend/                 # Node.js/Express backend
│   ├── .env.development    # Development environment variables
│   ├── .env.production     # Production environment variables
│   ├── src/                # Source code
│   └── dist/               # Built files
├── frontend/               # React/Vite frontend
│   ├── .env.development    # Development environment variables
│   ├── .env.production     # Production environment variables
│   ├── src/                # Source code
│   └── dist/               # Built files
├── setup-env.js            # Environment setup script
└── README.md               # This file
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/registrations` - Submit registration form
- `GET /api/registrations` - Get all registrations (admin)
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify admin token

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MySQL (for admin authentication)

### Setup Steps
1. Clone the repository
2. Set up environment: `node setup-env.js development`
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. Configure database and update `.env` files
5. Start the applications using the commands above

## Deployment

1. Set up production environment: `node setup-env.js production`
2. Update production URLs in `.env.production` files
3. Build the applications:
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build:prod
   ```
4. Deploy the `dist` folders to your hosting provider

## Contributing

1. Create a feature branch
2. Make your changes
3. Test in both development and production modes
4. Submit a pull request

## License

This project is licensed under the MIT License.
