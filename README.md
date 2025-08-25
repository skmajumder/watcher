# 🕵️ Watcher SDK

A **high-performance error tracking SDK** designed specifically for **Next.js** and **React** applications.  
Watcher provides **comprehensive error monitoring**, **deduplication**, **rate limiting**, **breadcrumb tracking**, and (soon) **performance insights** — helping developers identify and resolve issues quickly without drowning in noise.

---

## 🎯 Project Status

### ✅ Milestone 1: SDK Bootstrapping + Core Error Capture

- [x] Project Initialization (`npm init`, TypeScript, build setup)
- [x] Base folder structure (`src/core`, `src/utils`, etc.)
- [x] `initWatcher()` function with config support
- [x] Global error capturing (`window.onerror`, `window.onunhandledrejection`)
- [x] Error processor with **deduplication** + **sampling**
- [x] Console logging for development

### 🚧 Upcoming

- Milestone 2: React integration (`<WatcherErrorBoundary>`, API wrapping, RTK Query middleware)
- Milestone 3: Server-side logging (Next.js API routes, SSR/SSG)
- Milestone 4: Enriched error payloads (route, session, user context)
- Milestone 5: Reporting to API / S3 storage
- Milestone 6+: Config files, plugins, templates

---

## 🏗️ Project Structure

```bash
src/
  core/        # Core error capture + processor
  config/      # Config parsing and defaults
  utils/       # Helpers (hashing, env detection, etc.)
  index.ts     # SDK entry point
types/         # TypeScript types
watcher.config.ts
```

## 🚀 Features

### Current

- ✅ Capture runtime errors via window.onerror
- ✅ Capture unhandled promise rejections
- ✅ Error deduplication (fingerprint + TTL)
- ✅ Error sampling (sampleRate)
- ✅ Basic rate limiting
- ✅ Non-blocking logging with queueMicrotask

### Planned (Future Milestones)

- 🔄 React error boundary support
- 🔄 API + fetch error capture
- 🔄 RTK Query integration
- 🔄 Breadcrumbs (user actions, route changes)
- 🔄 Server-side + Next.js error capture
- 🔄 Configurable reporting (API, S3, file)

## 📦 Installation

```bash
npm install watcher
```

## 🔧 Usage

```typescript
import { initWatcher } from 'watcher';

// Initialize with default settings
initWatcher();

// Initialize with custom configuration
initWatcher({
  environment: 'production',
  sampleRate: 0.1, // Collect 10% of errors
  maxBreadcrumbs: 50, // Store up to 50 breadcrumbs per error
});

// Example: an unhandled error
function triggerError() {
  throw new Error('Something went wrong!');
}

triggerError();

// Watcher will capture:
// {
//   type: "runtime_error",
//   message: "Something went wrong!",
//   stack: "...",
//   url: "http://localhost:3000/",
//   timestamp: "2025-08-24T18:30:00.000Z"
// }
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run in development mode with watch
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm run test
```

### Build Output

The SDK builds to multiple formats:

- **ESM**: `dist/index.js` - Modern ES modules
- **CommonJS**: `dist/index.cjs` - Node.js compatibility
- **Types**: `dist/index.d.ts` - TypeScript definitions

## 🧪 Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test -- --watch
```

## 📚 API Reference

### Core Types

#### `WatcherConfig`

Configuration interface for the SDK:

```typescript
interface WatcherConfig {
  environment: WatcherEnv; // "development" | "production"
  sampleRate?: number; // Fraction of errors to capture (0.0–1.0)
  maxBreadcrumbs?: number; // Max breadcrumbs per error
}
```

#### `ErrorKind`

Categories of errors the SDK can track:

- `runtime_error` - General JavaScript errors
- `unhandled_promise` - Unhandled promise rejections
- `promise_rejection` - Explicit promise rejections
- `network_error` - Network request failures
- `http_error` - HTTP response errors
- `render_error` - React rendering errors

#### `ErrorPayload`

Complete error information structure:

```typescript
interface ErrorPayload {
  type: ErrorKind;
  name?: string;
  message?: string;
  stack?: string;
  source?: string;
  position?: string;
  url?: string;
  route?: string;
  userAgent?: string;
  timestamp: string;
  environment?: WatcherEnv;
  sessionId?: string;
}
```

### Utility Functions

#### `isBrowser()`

Detects if code is running in browser environment:

```typescript
import { isBrowser } from 'watcher';

if (isBrowser()) {
  console.log('Running in browser');
}
```

## 🔒 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes + add tests
4. Submit a PR 🚀

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/skmajumder/watcher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skmajumder/watcher/discussions)

## 🗺️ Roadmap

### Milestone 1: Foundation (Complete)

- [x] Init project
- [x] Global error capture
- [x] Deduplication + sampling
- [x] Basic processor

### Milestone 2: React Integration 🚧

- [ ] ErrorBoundary component
- [ ] Fetch + API errors
- [ ] RTK Query middleware
- [ ] Asset load errors

### Milestone 3: Server + SSR

- [ ] API route wrapper
- [ ] SSR/SSG error capture
- [ ] Hydration mismatch handling

### Milestone 4: Enriched Payloads

- [ ] Metadata injection
- [ ] Session management
- [ ] Breadcrumb attachments
- [ ] User context

### Milestone 5: Reporting

- [ ] API reporting
- [ ] S3 upload
- [ ] Configurable delivery
