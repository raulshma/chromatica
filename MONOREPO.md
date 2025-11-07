# Chromatica Monorepo

This is a monorepo containing the Chromatica mobile app and its Express API backend.

## Structure

```
chromatica/
├── apps/
│   └── mobile/              # React Native Expo app
│       ├── package.json
│       ├── app/            # Expo Router app directory
│       ├── components/
│       ├── services/
│       ├── slices/
│       └── ...
├── packages/
│   ├── api/                # Express API (Vercel-ready)
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── index.ts    # Entry point
│   │   ├── vercel.json
│   │   └── ...
│   └── shared/             # Shared types
│       ├── package.json
│       ├── src/
│       │   ├── types/
│       │   │   ├── wallpaper.ts
│       │   │   ├── user.ts
│       │   │   ├── env.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       └── ...
├── package.json            # Root workspace config
├── tsconfig.json           # Root TypeScript config with references
├── vercel.json             # Root Vercel config
└── ...
```

## Status

✅ **Monorepo Setup Complete and Verified:**

- npm workspaces configured and optimized
- Root directory cleaned - all workspace-specific files organized into `apps/` and `packages/`
- API package: Fully functional ✓ (builds, type-checks, lints, tests)
- Shared types package: Fully functional ✓ (builds, type-checks)
- Mobile app: Fully migrated to `apps/mobile/` ✓ (type-checks, lints, tests pass)

✅ **All End-to-End Verification Complete:**

- ✓ Dependencies resolved correctly across all workspaces
- ✓ Type-checking passes for entire monorepo
- ✓ Linting passes for all packages
- ✓ All tests pass (3 mobile tests, 0 API tests with `passWithNoTests`)
- ✓ API build completes successfully
- ✓ LinearGradient type compatibility issues resolved

⚠️ **Mobile App Build:**

The mobile app uses EAS for builds. Use `npm run build:mobile` to trigger EAS build, or use `dev:build:mobile` for development builds.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Development

**Mobile App Only:**

```bash
npm run dev:mobile
npm run dev:ios
npm run dev:android
npm run dev:web
```

**API Only:**

```bash
npm run dev:api
```

**Both (in parallel):**

```bash
npm run dev:all
```

### Build

**API Only:**

```bash
npm run build:api
```

**Type-check all packages:**

```bash
npm run build
```

**Mobile (EAS Build):**

```bash
npm run build:mobile
```

**Development build for mobile:**

```bash
npm run dev:build:web    # Web build
npm run dev:build:mobile # Development mobile build
```

### Testing

**API Tests:**

```bash
npm run test:api
npm run test:api:watch
```

**Mobile Tests:**

```bash
npm run test:mobile
npm run test:mobile:watch
```

**All Tests:**

```bash
npm run test
npm run test:watch
```

### Linting & Formatting

```bash
npm run lint
npm run format
npm run type-check
```

## Workspaces

### @chromatica/mobile

React Native + Expo + Redux mobile application for wallpaper management.

- **Scripts:** `dev`, `dev:ios`, `dev:android`, `dev:web`, `build`, `test`
- **Entry:** `expo-router/entry` → `apps/mobile/app/_layout.tsx`

### @chromatica/api

Express.js REST API server, deployable to Vercel.

- **Scripts:** `dev`, `build`, `start`, `test`
- **Entry:** `packages/api/src/index.ts`
- **Endpoints:**
  - `GET /` - Health check
  - `GET /wallpapers` - List wallpapers from UploadThing

### @chromatica/shared

Shared TypeScript types and utilities.

- **Exports:** Types for Wallpaper, User, etc.
- **Consumed by:** Mobile app and API

## Deployment

### API to Vercel

```bash
cd packages/api
vercel deploy
```

Set environment variables in Vercel:

- `UPLOADTHING_TOKEN` - UploadThing API token

### Mobile to EAS

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

## Environment Variables

### Mobile App (`apps/mobile/.env.dev`, `.env.prod`)

```env
ENV=development
API_URL=http://localhost:3000
EXPO_SLUG=chromatica
```

### API Server (`packages/api/.env.local`)

```env
UPLOADTHING_TOKEN=your_token_here
NODE_ENV=development
```

## Key Commands

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `npm run dev`        | Start mobile app (default)     |
| `npm run dev:api`    | Start API server               |
| `npm run dev:all`    | Start mobile + API in parallel |
| `npm run build`      | Build both mobile and API      |
| `npm run test`       | Run all tests                  |
| `npm run type-check` | Type check all workspaces      |
| `npm run lint`       | Lint all workspaces            |

## Type Safety

TypeScript project references are configured for proper type checking across workspaces:

```bash
npm run type-check
```

All imports from shared types use proper path aliases:

- Mobile: `@chromatica/shared`
- API: `@chromatica/shared`

## Notes

- The monorepo uses npm workspaces (`workspace:*` protocol)
- TypeScript composite mode is enabled for incremental builds
- Shared types are published locally via workspace dependencies
- API exports default Express app for Vercel serverless functions
- Mobile app uses Expo Router for file-based routing
