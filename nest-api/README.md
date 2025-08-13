# LangGraph Backend API

NestJS backend with OAuth authentication (GitHub/Google) and AI usage tracking.

## Features

✅ OAuth 2.0 authentication (GitHub, Google)
✅ JWT-based session management (HttpOnly cookies)
✅ MongoDB user storage with Mongoose
✅ AI usage tracking per user (monthly limits)
✅ CORS configured for frontend integration

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth app credentials
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `JWT_SECRET` - Secret key for JWT signing
- `FRONTEND_URL` - Frontend URL for redirects after auth

### 3. Start MongoDB
Make sure MongoDB is running locally or use a cloud instance.

### 4. Run the Application
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback
- `GET /auth/google` - Initiate Google OAuth  
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/me` - Get current user profile (requires auth)
- `POST /auth/logout` - Logout current user

### AI Usage
- `POST /ai/generate` - Generate AI response (tracks usage)
- `GET /ai/usage` - Check current month's usage

## Project Structure

```
src/
├── auth/           # Authentication module (Passport strategies, JWT)
├── users/          # User management module
├── ai-usage/       # AI usage tracking service
├── ai/             # AI endpoints
└── app.module.ts   # Main application module
```

## OAuth Setup

### GitHub OAuth App
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL to: `http://localhost:3000/auth/github/callback`

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
