# Chromatica

A full-stack monorepo for exploring, managing, and setting beautiful wallpapers on mobile devices. Chromatica combines a React Native mobile app, a scalable Express API backend, and an admin dashboard for wallpaper curation—all unified through shared TypeScript types.

**Version:** 5.0.0  
**License:** MIT

---

## 🏗️ Architecture

Chromatica is organized as an **npm monorepo** with TypeScript project references for seamless type safety across packages:

### Packages

| Package | Type | Purpose | Tech Stack |
|---------|------|---------|-----------|
| **`@chromatica/mobile`** | App | Cross-platform wallpaper browsing & management | React Native, Expo, Redux Toolkit |
| **`@chromatica/api`** | Backend | RESTful API for wallpaper data & management | Express.js, MongoDB, Redis |
| **`admin`** | Dashboard | Admin interface for wallpaper uploads & curation | Next.js, UploadThing, MongoDB |
| **`@chromatica/shared`** | Library | TypeScript types & utilities shared across all packages | TypeScript |

### Directory Structure

```
chromatica/
├── apps/
│   ├── mobile/                 # React Native app (Expo Router)
│   │   ├── app/               # File-based routing
│   │   ├── services/          # API service layer
│   │   ├── slices/            # Redux state management
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── theme/             # Design tokens & colors
│   └── admin/                 # Next.js admin dashboard
│       ├── app/               # Next.js routing
│       ├── components/        # React components
│       ├── lib/               # Utilities & API clients
│       └── public/            # Static assets
├── packages/
│   ├── api/                   # Express backend
│   │   ├── src/
│   │   │   ├── index.ts      # Express app & routes
│   │   │   ├── config.ts     # Environment config
│   │   │   ├── db.ts         # MongoDB client
│   │   │   ├── redis-client.ts # Redis connection
│   │   │   └── middleware/   # Express middleware
│   │   └── vercel.json       # Vercel deployment config
│   └── shared/               # Shared types & constants
│       └── src/
│           └── types/        # TypeScript type definitions
├── package.json              # Root workspace config
├── tsconfig.json             # Root TypeScript config
└── vercel.json              # Root Vercel config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js:** ≥18.17.0
- **npm:** ≥9.0.0
- **Expo CLI** (for mobile development)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd chromatica
npm install
```

### Development

```bash
# Mobile app (default)
npm run dev

# API server only
npm run dev:api

# Admin dashboard
npm run dev:admin

# All services in parallel
npm run dev:all

# Platform-specific mobile builds
npm run dev:ios       # iOS simulator
npm run dev:android   # Android emulator
npm run dev:web       # Web browser
```

### Building

```bash
# Type-check entire monorepo
npm run type-check

# Build API for production
npm run build:api

# Build mobile (EAS)
npm run build:mobile

# Build admin dashboard
npm run build:admin

# Full build & type-check
npm run build
```

### Testing & Linting

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Linting all packages
npm run lint

# Auto-format code
npm run format
```

---

## 📱 Mobile App (`@chromatica/mobile`)

A React Native application built with Expo for iOS, Android, and Web platforms.

### Features

- **Wallpaper Feed:** Browse curated wallpapers with infinite scroll
- **Wallpaper Details:** View high-resolution images with metadata
- **Favorites:** Save and manage favorite wallpapers
- **Set Wallpaper:** Quick actions to set wallpapers as lock screen or home screen
- **User Profile:** Manage user preferences and account settings
- **Deep Linking:** Direct navigation via custom URL schemes

### Key Technologies

- **Expo Router:** File-based routing similar to Next.js
- **Redux Toolkit:** Centralized state management with slices
- **React Navigation:** Tab and drawer navigation
- **Async Storage:** Local data persistence
- **Gorhom Bottom Sheet:** Native sheet components

### Project Structure

```
apps/mobile/
├── app/                  # Expo Router pages
│   ├── _layout.tsx      # Root layout with providers
│   ├── index.tsx        # Home screen
│   ├── set-wallpaper.tsx # Wallpaper detail & set
│   └── (main)/          # Main app routes
├── components/
│   ├── elements/        # Low-level UI components
│   └── layouts/         # Page/screen layout wrappers
├── services/            # API service functions
│   ├── wallpaper.service.ts
│   └── user.service.ts
├── slices/              # Redux state slices
│   ├── app.slice.ts
│   ├── wallpaper.slice.ts
│   └── index.ts
├── hooks/               # Custom React hooks
├── theme/               # Design tokens, colors, fonts
└── utils/
    ├── config.ts        # Environment & API configuration
    ├── store.ts         # Redux store setup
    └── deviceInfo.ts    # Device utilities
```

### Running

```bash
# Development
npm run dev:mobile

# Platform-specific
npm run dev:ios
npm run dev:android
npm run dev:web

# Type-check
npm run type-check

# Test
npm run test

# Lint
npm run lint
```

---

## 🔌 API (`@chromatica/api`)

An Express.js REST API server with MongoDB backend, deployable to Vercel as a serverless function.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/wallpapers` | Fetch wallpaper feed with metadata |
| `POST` | `/admin/wallpapers` | Create wallpaper (admin only) |
| `PUT` | `/admin/wallpapers/:id` | Update wallpaper (admin only) |
| `DELETE` | `/admin/wallpapers/:id` | Delete wallpaper (admin only) |

### Features

- **Caching:** Redis integration for `/wallpapers` endpoint (120s TTL)
- **Rate Limiting:** Configurable global & endpoint-specific limits
- **Security:** Helmet.js headers, CORS protection, Bearer token auth for admin routes
- **Database:** MongoDB for persistent wallpaper storage
- **Type Safety:** Full TypeScript with shared types from `@chromatica/shared`

### Middleware Stack

```
Request
  ↓
Helmet (Security Headers)
  ↓
CORS (Cross-Origin Validation)
  ↓
Global Rate Limiter
  ↓
JSON Parser
  ↓
Endpoint-Specific Middleware (Cache, Rate Limit, Auth)
  ↓
Route Handler
```

### Project Structure

```
packages/api/src/
├── index.ts             # Express app & route definitions
├── config.ts            # Environment variables & config
├── db.ts                # MongoDB client & collections
├── redis-client.ts      # Redis connection pool
├── middleware/
│   ├── security.ts      # Helmet & CORS setup
│   ├── rateLimit.ts     # Express rate limiter
│   ├── cache.ts         # Redis caching logic
│   └── adminAuth.ts     # Bearer token validation
└── routes/              # API routes (if modularized)
```

### Environment Variables

```env
# .env.dev
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379
UPLOADTHING_TOKEN=sk_live_...
ADMIN_TOKEN=your_secret_token
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL_SECONDS=120
```

### Running

```bash
# Development (watch mode)
npm run dev:api

# Build
npm run build:api

# Start production server
npm start

# Test
npm run test:api

# Type-check
npm run type-check
```

---

## 📊 Admin Dashboard (`admin`)

A Next.js-based admin interface for managing wallpapers, uploads, and curation.

### Features

- **Wallpaper Upload:** Batch upload with UploadThing integration
- **Wallpaper Management:** Edit metadata, tags, and descriptions
- **Category Management:** Organize wallpapers into collections
- **AI-Generated Descriptions:** Auto-generate wallpaper briefs using Gemini API
- **Authentication:** Secure admin login system

### Technologies

- **Next.js 16:** Server components & API routes
- **UploadThing:** File upload service
- **MongoDB:** Data persistence
- **Vercel AI SDK:** AI-powered features (Gemini)
- **Tailwind CSS:** Styling

### Running

```bash
npm run dev:admin     # http://localhost:3001
npm run build         # Production build
npm start             # Start production server
```

---

## 🤝 Shared Types (`@chromatica/shared`)

TypeScript type definitions and utilities shared across mobile, API, and admin packages.

### Exported Types

#### `Wallpaper`

```typescript
interface Wallpaper {
  _id: string;                  // MongoDB ObjectId
  uploadThingFileKey: string;   // UploadThing file key
  fileName: string;             // Original filename
  displayName?: string;         // UI display name
  description?: string;
  previewUrl: string;           // Thumbnail URL
  fullUrl: string;              // Full-resolution URL
  size: number;                 // File size in bytes
  uploadedAt: string;           // ISO timestamp
  dominantColor?: string;       // Hex color
  tags?: string[];              // Metadata tags
  artist?: string;              // Creator name
  brief?: string;               // AI-generated description
}
```

#### `WallpaperFeedResponse`

```typescript
interface WallpaperFeedResponse {
  items: Wallpaper[];
  collections?: WallpaperCollection[];
  generatedAt: string;
}
```

#### `User`

User profile and authentication data shared between mobile and API.

### Usage

```typescript
// Import in mobile or API
import type { Wallpaper, WallpaperFeedResponse } from '@chromatica/shared';

const wallpapers: Wallpaper[] = [...];
const response: WallpaperFeedResponse = { items: wallpapers, generatedAt: new Date().toISOString() };
```

---

## 🛠️ Development Workflow

### Adding a New API Endpoint

1. **Define Types:** Update `packages/shared/src/types/` if needed
2. **Add Route:** Create handler in `packages/api/src/index.ts`
3. **Apply Middleware:** Add rate limiting, caching, or auth as needed
4. **Test:** Run `npm run test:api` or use curl/Postman
5. **Type-Check:** Run `npm run type-check`

### Adding a Mobile Feature

1. **Create Service:** Add function to `apps/mobile/services/`
2. **Add Redux Slice:** Update `apps/mobile/slices/` if state needed
3. **Create Component:** Build UI in `apps/mobile/components/`
4. **Add Route:** Create file in `apps/mobile/app/`
5. **Test:** Run `npm run test:mobile` or `npm run dev:ios`

### Updating Shared Types

1. Modify `packages/shared/src/types/*.ts`
2. Export from `packages/shared/src/index.ts` if new
3. Run `npm run type-check` to verify monorepo compiles
4. Update consumers in mobile/API as needed

### Code Style & Formatting

```bash
# Format all files
npm run format

# Lint all packages
npm run lint

# Type-check monorepo
npm run type-check
```

---

## 📦 Deployment

### API to Vercel

```bash
# Deploy from root
vercel deploy

# Or from API package
cd packages/api
vercel deploy
```

**Environment Variables in Vercel:**

```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
UPLOADTHING_TOKEN=sk_live_...
ADMIN_TOKEN=your_secret_token
CORS_ORIGINS=https://your-domain.com
```

### Mobile to EAS (Expo Application Services)

```bash
# Build for iOS
npm run build:mobile

# Build for Android
eas build --platform android

# Deploy with updates
npm run dev:deploy:web
```

### Admin Dashboard to Vercel

```bash
npm run build:admin
vercel deploy
```

---

## 🔐 Security

### API Security

- **Helmet.js:** HTTP headers hardening
- **CORS:** Configurable cross-origin requests
- **Rate Limiting:** Prevent abuse with express-rate-limit
- **Admin Auth:** Bearer token validation for sensitive endpoints
- **Input Validation:** Type-safe requests with TypeScript

### Mobile Security

- **Environment Secrets:** EAS secrets for production API tokens
- **Local Storage:** Async storage for non-sensitive user data
- **Deep Link Validation:** URI scheme verification

---

## 📊 Project Statistics

- **Workspaces:** 4 (mobile, api, admin, shared)
- **Languages:** TypeScript, JavaScript, TSX, JSX
- **Type Safety:** Full TypeScript monorepo with project references
- **Testing:** Jest for all packages
- **CI/CD:** Pre-commit hooks with Husky + lint-staged

---

## 🐛 Troubleshooting

### Common Issues

**Mobile app won't start**
```bash
# Clear cache and reinstall
npm install
npm run dev:mobile
```

**API connection errors**
```bash
# Ensure API is running on correct port
npm run dev:api

# Check config in apps/mobile/utils/config.ts
```

**Type errors after package update**
```bash
npm run type-check
npm install
```

**Redis/MongoDB connection issues**
```bash
# Verify environment variables
# Check .env.dev or .env.prod files
# Ensure local services are running (for development)
```

---

## 📚 Documentation

- **Architecture Details:** See `.github/copilot-instructions.md` for in-depth patterns
- **Monorepo Setup:** See `MONOREPO.md` for workspace configuration

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes with clear messages
4. Push to your fork
5. Open a pull request

### Code Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add tests for new features
- Run `npm run format` and `npm run lint` before committing
- Update types in `@chromatica/shared` if changing data structures

---

## 📄 License

MIT License – See `LICENSE` file for details.

---

## 👤 Author

Created by [Wataru Maeda](https://github.com/wataru-maeda)

---

## 🎯 Roadmap

- [ ] Offline wallpaper management
- [ ] Enhanced wallpaper search & filtering
- [ ] User-generated collections
- [ ] Social sharing features
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Multi-language support

---

## 📞 Support

For issues, questions, or suggestions, please open an [GitHub issue](https://github.com/raulshma/chromatica/issues).

---

**Happy coding! 🎨**
