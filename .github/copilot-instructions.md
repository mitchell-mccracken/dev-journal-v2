# Dev Journal v2 - AI Coding Guidelines

## Project Architecture

This is a TypeScript monorepo using npm workspaces with two packages:
- `client/` - Vue 3 + Vuetify 3 frontend (Vite build)
- `server/` - Express API with MongoDB/Mongoose

**Data flow**: Vue components → Pinia stores → API service (`@/services/api.ts`) → Express routes → Mongoose models → MongoDB

## Key Patterns

### Backend (Express/TypeScript)

- **Route structure**: `server/src/routes/` - each file exports a router, aggregated in `routes/index.ts`
- **Models**: Mongoose schemas in `server/src/models/` with TypeScript interfaces (e.g., `IUser extends Document`)
- **Auth middleware**: Use `authenticate` from `@/middleware/auth` and `AuthRequest` type for protected routes
- **Config access**: Import from `@/config` - never use `process.env` directly in route handlers

```typescript
// Protected route pattern
router.get('/protected', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!._id; // User attached by middleware
});
```

### Frontend (Vue 3/Vuetify)

- **Composition API only**: Use `<script setup lang="ts">` in all components
- **State management**: Pinia stores in `client/src/stores/` - auth state lives in `useAuthStore()`
- **API calls**: Always go through `@/services/api.ts`, never use axios directly in components
- **Routing**: Protected routes use `meta: { requiresAuth: true }`, guest-only use `meta: { guest: true }`
- **Path aliases**: Use `@/` for `client/src/` imports

```vue
<!-- Component pattern -->
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
const authStore = useAuthStore();
</script>
```

### Vuetify Components

- Use Vuetify components (`v-btn`, `v-card`, `v-text-field`) for UI
- Icons use `mdi-*` prefix (Material Design Icons)
- Form validation uses inline rules array pattern

## Development Commands

```bash
npm run dev          # Start both client (5173) and server (3000)
npm run dev:server   # Backend only with hot reload
npm run dev:client   # Frontend only
```

## Environment Setup

Copy `.env.example` to `.env`. Required variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing (change in production!)

## File Naming Conventions

- Vue views: `PascalCase` + `View.vue` suffix (e.g., `HomeView.vue`)
- Stores: camelCase matching export name (e.g., `auth.ts` → `useAuthStore`)
- Routes/Models: lowercase (e.g., `auth.ts`, `User.ts`)

## Adding New Features

1. **New API endpoint**: Add route in `server/src/routes/`, register in `routes/index.ts`
2. **New model**: Create in `server/src/models/`, export from `models/index.ts`
3. **New page**: Add view in `client/src/views/`, add route in `router/index.ts`
4. **New store**: Create in `client/src/stores/`, follow `defineStore` composition pattern
