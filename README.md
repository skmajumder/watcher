# Watcher SDK

A high-performance error tracking SDK designed specifically for Next.js and React applications. The Watcher SDK provides comprehensive error monitoring, breadcrumb tracking, and performance insights to help developers identify and resolve issues quickly.

## 🎯 Project Status

### Milestone 1: Foundation Setup ✅
- **Step 1.1: Project Initialization** ✅ Complete
- **Step 1.2: Base Folder Structure** ✅ Complete
- **Step 1.3: Core Error Handling** 🔄 In Progress
- **Step 1.4: Transport Layer** 📋 Planned

## 🏗️ Project Structure

```
watcher/
├── src/
│   ├── client/          # Browser-specific implementations
│   ├── config/          # Configuration management
│   │   └── defaults.ts  # Default SDK configuration
│   ├── core/            # Core error tracking logic
│   │   └── placeholder.ts # Placeholder for core functionality
│   ├── handlers/        # Error event handlers
│   ├── server/          # Server-side implementations
│   ├── transports/      # Data transmission layer
│   ├── types/           # TypeScript type definitions
│   │   └── types.ts     # Core types and interfaces
│   ├── utils/           # Utility functions
│   │   └── index.ts     # Environment detection helpers
│   └── index.ts         # Main SDK entry point
├── tests/               # Test suite
├── types/               # Additional type definitions
└── dist/                # Build output (generated)
```

## 🚀 Features

### Current (Milestone 1.2)
- ✅ TypeScript project setup with proper configuration
- ✅ Build system using tsup for ESM/CJS dual output
- ✅ Comprehensive type definitions for error tracking
- ✅ Environment detection utilities
- ✅ Default configuration management
- ✅ Project structure for future development

### Planned (Future Milestones)
- 🔄 Real-time error monitoring
- 🔄 Breadcrumb tracking for user actions
- 🔄 Automatic error categorization
- 🔄 Performance monitoring
- 🔄 React error boundary integration
- 🔄 Next.js specific optimizations
- 🔄 Multiple transport backends
- 🔄 Sampling and rate limiting

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
  sampleRate: 0.1,        // Collect 10% of errors
  maxBreadcrumbs: 50      // Store up to 50 breadcrumbs per error
});
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
  environment: WatcherEnv;        // Required: deployment environment
  sampleRate?: number;            // Optional: error sampling rate (0.0-1.0)
  maxBreadcrumbs?: number;        // Optional: max breadcrumbs per error
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
  type: ErrorKind;               // Error category
  name?: string;                 // Error name/constructor
  message?: string;              // Human-readable message
  stack?: string;                // Stack trace
  source?: string;               // Source file/component
  position?: string;             // Line:column position
  url?: string;                  // Current URL
  route?: string;                // Current route
  userAgent?: string;            // Browser user agent
  timestamp: string;             // ISO timestamp
  environment?: WatcherEnv;      // Environment context
  sessionId?: string;            // User session ID
}
```

### Utility Functions

#### `isBrowser()`
Detects if code is running in browser environment:
```typescript
import { isBrowser } from 'watcher';

if (isBrowser()) {
  // Browser-specific code
} else {
  // Server-side code
}
```

## 🔒 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/skmajumder/watcher/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skmajumder/watcher/discussions)

## 🗺️ Roadmap

### Milestone 1: Foundation (Current)
- [x] Project setup and structure
- [x] Type definitions
- [ ] Core error handling
- [ ] Transport layer

### Milestone 2: Core Features
- [ ] Error event listeners
- [ ] Breadcrumb tracking
- [ ] Error categorization
- [ ] Basic transport

### Milestone 3: Advanced Features
- [ ] Performance monitoring
- [ ] React integration
- [ ] Next.js optimizations
- [ ] Advanced sampling

### Milestone 4: Production Ready
- [ ] Production testing
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Release preparation
