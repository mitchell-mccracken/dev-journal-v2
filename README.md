# Dev Journal v2

A personal developer journal web application built with Vue 3 + Vuetify and Hono + MongoDB.

## Tech Stack

- **Frontend**: Vue 3, Vuetify 3, Pinia, TypeScript, Vite
- **Backend**: Hono, MongoDB driver, JWT authentication. Runs on Node (Heroku) and as a Cloudflare Worker
- **Monorepo**: npm workspaces

## Prerequisites

- Node.js 24
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
├── server/                 # Hono backend
│   ├── src/
│   │   ├── app.ts          # The API, shared by both hosts
│   │   ├── node.ts         # Heroku entry point
│   │   ├── worker.ts       # Cloudflare entry point
│   │   ├── routes/         # API routes
│   │   ├── db/             # Collection schemas, casting/validation, populate
│   │   ├── middleware/     # Auth middleware
│   │   └── config/         # App configuration, MongoDB connection
│   └── package.json
├── wrangler.jsonc          # Cloudflare Worker config
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
| `npm run build:client` | Build only the frontend (Cloudflare's build step) |
| `npm start` | Run production server |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user |
| POST | `/api/auth/login` | Authenticate user |
| GET | `/api/auth/me` | Get current user (requires auth) |
| GET | `/api/health` | Health check |

## Deployment

The same API is deployed to Heroku and to Cloudflare, both pointing at one Atlas
database. [DEPLOYMENT.md](DEPLOYMENT.md) covers the Cloudflare setup and the
checklist for shipping an update. First-time Heroku setup:

```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-atlas-uri
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
git push heroku main
```
url is https://film-journal-app-4820cabb8531.herokuapp.com/home

