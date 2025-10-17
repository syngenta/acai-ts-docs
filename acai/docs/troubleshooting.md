---
title: Troubleshooting
description: Common issues and solutions for acai-ts
---

# 🔍 Troubleshooting

This guide covers common issues you may encounter when using acai-ts and their solutions.

## 🛣️ Route Resolution Issues

### 🏭 routePath Differences Between Development and Build

**Problem:** Routes work in development but fail in production builds, or vice versa.

**Symptoms:**
- Routes return 404 errors in production
- Path parameters are not correctly parsed
- Route matching behaves differently between local development and deployed environments

**Causes:**
- File path resolution differences between development and compiled code
- TypeScript compilation changing file structure
- Serverless packaging affecting route discovery

**Solutions:**

#### 1️⃣ Use Absolute Paths in Router Configuration
```typescript
// ❌ Problematic - relative paths
const router = new Router({
  mode: 'directory',
  routesPath: './api/handlers'
});

// ✅ Better - absolute paths from project root
const router = new Router({
  mode: 'directory',
  routesPath: path.join(__dirname, '../api/handlers')
});
```

#### 2️⃣ Verify Build Output Structure
Check that your build process preserves the expected file structure:

```bash
# Check your dist/build directory structure
find dist -name "*.js" -type f | head -10

# Ensure route files are in expected locations
ls -la dist/api/handlers/
```

#### 3️⃣ Use Explicit Route Lists for Production
For maximum reliability in production:

```typescript
const router = new Router({
  mode: 'list',
  routes: [
    { method: 'GET', path: '/users', handler: 'dist/api/handlers/users.js' },
    { method: 'POST', path: '/users', handler: 'dist/api/handlers/users.js' },
    { method: 'GET', path: '/users/:id', handler: 'dist/api/handlers/users/[id].js' }
  ]
});
```

#### 4️⃣ Environment-Specific Configuration
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const router = new Router({
  mode: 'directory',
  routesPath: isDevelopment 
    ? 'src/api/handlers'
    : path.join(__dirname, 'api/handlers'),
  basePath: isDevelopment ? '' : '/api/v1'
});
```

#### 5️⃣ Debug Route Discovery
Enable logging to see which routes are being discovered:

```typescript
const router = new Router({
  mode: 'pattern',
  routesPath: 'api/**/*.js',
  outputError: true, // Enable error output
  globalLogger: true // Enable detailed logging
});

// Add custom logging
router.autoLoad();
console.log('Discovered routes:', router.getRoutes?.());
```

## 🎨 Decorator Issues

### 🪞 Reflect Metadata Not Found

**Problem:** `Cannot read property 'getMetadata' of undefined` or similar metadata errors.

**Solution:**
```typescript
// ✅ Must be imported FIRST, before any decorators
import 'reflect-metadata';
import { Route, Validate } from 'acai-ts';

// Rest of your code...
```

### 🔧 TypeScript Configuration Issues

**Problem:** Decorators not working or compiler errors.

**Solution:** Ensure your `tsconfig.json` has the correct settings:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

### 🔢 Decorator Order Issues

**Problem:** Middleware not executing in expected order.

**Solution:** Understand the execution order:

```typescript
export class UserController {
  // Execution order:
  @Route('POST', '/users')    // 1. Route definition
  @Auth(authFunction)         // 2. Authentication (executed first)
  @Validate(schema)           // 3. Validation (executed second)
  @Before(beforeMiddleware)   // 4. Before middleware (executed third)
  @After(afterMiddleware)     // 6. After middleware (executed after handler)
  @Timeout(5000)              // Applied throughout entire request
  async createUser(...) {     // 5. Handler function
    // Your code here
  }
}
```

### ❌ Method Not Found Errors

**Problem:** `Method not found` or handler not being called.

**Common Causes & Solutions:**

#### 1️⃣ Method Name Mismatch
```typescript
// ❌ Wrong - method name doesn't match decorator
@Route('POST', '/users')
async getUser() {} // Method name suggests GET but decorator says POST

// ✅ Correct - clear method names
@Route('POST', '/users')
async createUser() {}

@Route('GET', '/users/:id')
async getUser() {}
```

#### 2️⃣ Missing Export
```typescript
// ❌ Wrong - not exported
@Route('GET', '/users')
async getUsers() {}

// ✅ Correct - properly exported
export class UserController {
  @Route('GET', '/users')
  async getUsers() {}
}
```

#### 3️⃣ Router Not Recognizing Decorated Routes
```typescript
// Make sure your router is configured correctly for decorators
const router = new Router({
  mode: 'list',
  routes: [], // Empty array - routes come from decorators
  // ... other config
});

// And that you're importing decorated classes somewhere
import './controllers/UserController'; // This registers the decorated routes
```

## ✓ Validation Issues

### 🚨 Schema Validation Failures

**Problem:** Valid requests are being rejected or invalid requests are passing.

**Debug Steps:**

1. **Check Schema Syntax:**
```typescript
// ✅ Correct JSON Schema
@Validate({
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' }
    }
  }
})

// ❌ Common mistake - wrong schema structure
@Validate({
  name: { type: 'string' }, // Missing 'body' wrapper
  email: { type: 'string' }
})
```

2. **Enable Validation Logging:**
```typescript
const router = new Router({
  // ... other config
  outputError: true, // Show detailed validation errors
  validateResponse: true // Also validate responses
});
```

3. **Test Schema Separately:**
```typescript
import { Validator } from 'acai-ts';

const validator = new Validator();
const schema = { /* your schema */ };
const data = { /* your test data */ };

const result = validator.validate(data, schema);
console.log('Validation result:', result);
```

### 📄 OpenAPI Validation Issues

**Problem:** Router with `autoValidate: true` not working correctly.

**Solution:**
```typescript
const router = new Router({
  mode: 'directory',
  routesPath: 'api/handlers',
  autoValidate: true,
  schemaPath: './openapi.yml', // Make sure this path is correct
  validateResponse: false // Set to true only if you have response schemas
});
```

Verify your OpenAPI schema:
- Paths match your route structure exactly
- HTTP methods are correctly defined
- Request/response schemas are valid JSON Schema

## ⚡ Performance Issues

### 🐢 Slow Route Resolution

**Problem:** First request takes a long time or timeouts occur.

**Solutions:**

1. **Use `autoLoad()` for Better Cold Start Performance:**
```typescript
const router = new Router({
  mode: 'directory',
  routesPath: 'api/handlers'
});

// Pre-load routes during Lambda initialization
router.autoLoad();

export const handler = async (event) => {
  return router.route(event);
};
```

2. **Optimize File Discovery:**
```typescript
// ✅ Specific patterns perform better
const router = new Router({
  mode: 'pattern',
  routesPath: 'api/handlers/**/*.controller.js' // Specific pattern
});

// ❌ Avoid overly broad patterns
const router = new Router({
  mode: 'pattern',
  routesPath: '**/*.js' // Too broad, scans entire project
});
```

### 💾 Memory Issues with Large Applications

**Problem:** High memory usage or out-of-memory errors.

**Solutions:**

1. **Use Targeted Route Loading:**
```typescript
// Instead of loading all routes, be selective
const router = new Router({
  mode: 'list',
  routes: [
    // Only include routes you actually need
    { method: 'GET', path: '/users', handler: 'handlers/users.js' }
  ]
});
```

2. **Avoid Loading Heavy Dependencies in Route Files:**
```typescript
// ❌ Heavy imports loaded for all routes
import * as AWS from 'aws-sdk';
import * as heavyLibrary from 'heavy-library';

@Route('GET', '/users')
async getUsers() {
  // Simple handler that doesn't need heavy libraries
}

// ✅ Lazy load heavy dependencies
@Route('POST', '/process-data')
async processData() {
  const AWS = await import('aws-sdk'); // Lazy load when needed
  const processor = await import('./heavy-processor');
  // Use as needed
}
```

## 🔐 Authentication Issues

### 🚨 @Auth Not Blocking Requests

**Problem:** Authentication decorator allows unauthorized requests through.

**Common Causes:**

1. **Auth Function Not Returning Boolean:**
```typescript
// ❌ Wrong - doesn't return boolean
@Auth(async (request) => {
  const user = await validateUser(request);
  // Missing return statement!
})

// ✅ Correct - explicitly returns boolean
@Auth(async (request) => {
  const user = await validateUser(request);
  return user !== null; // Explicit boolean return
})
```

2. **Async Issues:**
```typescript
// ❌ Wrong - not awaiting async operations
@Auth((request) => {
  return validateUser(request); // Returns Promise, not boolean!
})

// ✅ Correct - properly handling async
@Auth(async (request) => {
  const isValid = await validateUser(request);
  return isValid;
})
```

3. **Exception Handling:**
```typescript
// ✅ Good practice - handle exceptions properly
@Auth(async (request) => {
  try {
    const user = await validateUser(request);
    return user !== null;
  } catch (error) {
    console.error('Auth error:', error);
    return false; // Fail closed - deny access on error
  }
})
```

## 🚀 Build and Deployment Issues

### 🔄 Routes Not Found After Deployment

**Problem:** Routes work locally but return 404 in deployed environment.

**Solutions:**

1. **Check Build Output:**
```bash
# Verify your build includes route files
npm run build
find dist -name "*.js" | grep -E "(route|handler|controller)"
```

2. **Verify Serverless Configuration:**
```yaml
# serverless.yml
functions:
  api:
    handler: dist/handler.route  # Make sure path is correct
    events:
      - httpApi:
          path: /{proxy+}
          method: any
```

3. **Check File Extensions in Production:**
```typescript
// Use correct file extensions for your build output
const router = new Router({
  mode: 'pattern',
  routesPath: process.env.NODE_ENV === 'production'
    ? 'dist/**/*.js'    // Built files
    : 'src/**/*.ts'     // Source files
});
```

### ⏰ Timeout Issues

**Problem:** Functions timing out unexpectedly.

**Debug Steps:**

1. **Check Timeout Configuration:**
```typescript
// Function-level timeout
@Timeout(30000) // 30 seconds

// Router-level default
const router = new Router({
  timeout: 30000 // 30 seconds default
});
```

2. **Add Logging to Identify Bottlenecks:**
```typescript
@Before(async (request) => {
  console.log('Request started:', Date.now());
})

@After(async (request, response) => {
  console.log('Request completed:', Date.now());
})
```

## 🆘 Getting Help

If you continue to experience issues:

1. **Enable Debug Logging:**
```typescript
const router = new Router({
  globalLogger: true,
  outputError: true
});
```

2. **Check Examples:** Review the [working examples](https://github.com/syngenta/acai-ts-docs/tree/main/examples)

3. **Create Minimal Reproduction:** Strip down to the simplest possible case that demonstrates the issue

4. **Check Version Compatibility:** Ensure you're using compatible versions of acai-ts, TypeScript, and Node.js

For additional support, please check:
- [GitHub Issues](https://github.com/syngenta/acai-ts/issues)
- [NPM Package](https://www.npmjs.com/package/acai-ts)
- [Documentation Examples](https://github.com/syngenta/acai-ts-docs/tree/main/examples)