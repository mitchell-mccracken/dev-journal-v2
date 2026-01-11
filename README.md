# Dev Journal v2

A personal developer journal web application built with Vue 3 + Vuetify and Express + MongoDB.

## Tech Stack

- **Frontend**: Vue 3, Vuetify 3, Pinia, TypeScript, Vite
- **Backend**: Express, MongoDB/Mongoose, JWT authentication
- **Monorepo**: npm workspaces

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection and JWT secret
   ```

3. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

4. **Run development servers**:
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API at `http://localhost:3000`
   - Frontend at `http://localhost:5173`

## Project Structure

```
├── client/                 # Vue 3 frontend
│   ├── src/
│   │   ├── views/          # Page components
│   │   ├── router/         # Vue Router config
│   │   ├── stores/         # Pinia stores
│   │   ├── services/       # API client
│   │   └── plugins/        # Vuetify config
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Mongoose models
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # App configuration
│   └── package.json
├── .env.example            # Environment template
└── package.json            # Workspace root
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in dev mode |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the backend |
| `npm run build` | Build both for production |
| `npm start` | Run production server |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/health` | Health check |

## Deployment (Heroku)

The app is configured for Heroku deployment:

```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-atlas-uri
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
git push heroku main
```
