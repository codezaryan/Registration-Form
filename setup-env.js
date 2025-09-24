#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const environments = ['development', 'production'];
const env = process.argv[2] || 'development';

if (!environments.includes(env)) {
  console.error(`Invalid environment: ${env}`);
  console.error(`Available environments: ${environments.join(', ')}`);
  process.exit(1);
}

console.log(`Setting up ${env} environment...`);

// Copy environment files
const backendEnvSource = path.join(__dirname, 'backend', `.env.${env}`);
const backendEnvDest = path.join(__dirname, 'backend', '.env');

const frontendEnvSource = path.join(__dirname, 'frontend', `.env.${env}`);
const frontendEnvDest = path.join(__dirname, 'frontend', '.env');

try {
  if (fs.existsSync(backendEnvSource)) {
    fs.copyFileSync(backendEnvSource, backendEnvDest);
    console.log(`✅ Backend environment set to ${env}`);
  } else {
    console.error(`Backend environment file not found: ${backendEnvSource}`);
  }

  if (fs.existsSync(frontendEnvSource)) {
    fs.copyFileSync(frontendEnvSource, frontendEnvDest);
    console.log(`✅ Frontend environment set to ${env}`);
  } else {
    console.error(`Frontend environment file not found: ${frontendEnvSource}`);
  }

  console.log(`🎉 Environment setup complete!`);
  console.log(`Run the following commands to start the application:`);
  console.log(`  Backend: cd backend && npm run ${env === 'development' ? 'dev' : 'start:prod'}`);
  console.log(`  Frontend: cd frontend && npm run ${env === 'development' ? 'dev' : 'dev:prod'}`);

} catch (error) {
  console.error('Error setting up environment:', error.message);
  process.exit(1);
}
