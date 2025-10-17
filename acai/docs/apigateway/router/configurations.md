---
title: Configurations
description: The different options available to configure the router
---

# Router Configurations

As mentioned previously, the router is highly configurable to each project needs and desires. The point of the router is to enforce predictable thus making the API more extensible. Below is a table of all the configuration options available:

???+ example
    Don't like reading documentation? Then look at [our examples](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!

### Configuration Options

| option                 | type     | required                             | description                                                                       |
|------------------------|----------|--------------------------------------|-----------------------------------------------------------------------------------|
| **`routesPath`**       | string   | yes                                  | glob pattern to match handler files (supports TypeScript paths with auto-transform) |
| **`basePath`**         | string   | no                                   | the base path to strip from requests (e.g., '/api/v1')                           |
| **`schemaPath`**       | string   | no; required if using `autoValidate` | file path pointing to the location of the openapi.yml file                        |
| **`buildOutputDir`**   | string   | no                                   | build output directory for TypeScript compilation (auto-detects if not specified) |
| **`cache`**            | enum     | no; 'all', 'dynamic', 'static', 'none' | cache mode for route resolution (default: optimized caching)                   |
| **`autoValidate`**     | boolean  | no; requires `schemaPath`            | automatically validate requests against OpenAPI schema                            |
| **`validateResponse`** | boolean  | no                                   | validate responses against schema (useful for development)                       |
| **`timeout`**          | number   | no                                   | global timeout in milliseconds for all endpoints                                |
| **`outputError`**      | boolean  | no, (default: false)                 | output detailed error messages (recommended for non-production)                 |
| **`globalLogger`**     | boolean  | no                                   | enable global logger accessible via `global.logger`                              |
| **`loggerCallback`**   | function | no                                   | custom callback function for all log messages                                    |
| **`beforeAll`**        | function | no                                   | middleware to run before EVERY request                                          |
| **`afterAll`**         | function | no                                   | middleware to run after EVERY request                                           |
| **`withAuth`**         | function | no                                   | global authentication middleware (triggered by `@Auth()` or `auth: true`)        |
| **`onError`**          | function | no                                   | error handler for unhandled errors (not validation errors)                      |
| **`onTimeout`**        | function | no                                   | timeout handler when requests exceed timeout setting                            |


### Example: Router Configuration

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MiddlewareUtils } from './logic/middleware';
import { Authenticator } from './logic/authenticator';

const router = new Router({
    basePath: '/api/v1',
    routesPath: './src/handlers/**/*.ts',    // File-based routing with auto-transform
    schemaPath: './openapi.yml',
    buildOutputDir: '.build',               // Optional: auto-detects if not specified
    cache: 'all',                          // Cache all routes for performance
    autoValidate: true,
    validateResponse: process.env.STAGE !== 'prod', // Validate responses in dev
    timeout: 30000,                        // 30 seconds in milliseconds
    outputError: process.env.STAGE !== 'prod',      // Show errors in dev
    globalLogger: true,
    loggerCallback: MiddlewareUtils.loggerCallback,
    beforeAll: MiddlewareUtils.beforeAll,
    afterAll: MiddlewareUtils.afterAll,
    withAuth: Authenticator.authenticate,   // Global auth middleware
    onError: MiddlewareUtils.onError,
    onTimeout: MiddlewareUtils.onTimeout
});

// Optional: pre-load routes and schema for better cold start performance
router.autoLoad();

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    return await router.route(event);
};
```

### Example: Router Config with Minimal Setup

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Minimal configuration - most options are optional and have sensible defaults
const router = new Router({
    routesPath: './src/handlers/**/*.ts'  // Only required option
});

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    return await router.route(event);
};
```

### Example: Advanced Router Configuration

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Custom middleware functions
const authMiddleware = async (request, response) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token || !validateJWT(token)) {
        response.code = 401;
        response.setError('auth', 'Unauthorized');
    }
};

const loggerCallback = (log) => {
    // Send to external logging service
    console.log(JSON.stringify(log));
};

const router = new Router({
    // Required
    routesPath: './src/handlers/**/*.ts',
    
    // Optional configurations
    basePath: '/api/v1',
    schemaPath: './openapi.yml',
    buildOutputDir: '.build',
    cache: 'all',
    autoValidate: true,
    validateResponse: process.env.NODE_ENV === 'development',
    timeout: 30000,
    outputError: process.env.NODE_ENV !== 'production',
    globalLogger: true,
    loggerCallback,
    
    // Middleware
    beforeAll: async (request, response) => {
        console.log(`${request.method} ${request.path}`);
    },
    afterAll: async (request, response) => {
        console.log(`Response: ${response.code}`);
    },
    withAuth: authMiddleware,
    onError: async (request, response, error) => {
        console.error('Unhandled error:', error.message);
    },
    onTimeout: async (request, response, error) => {
        console.warn('Request timeout:', request.path);
    }
});

router.autoLoad();

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    return await router.route(event);
};
```

## Route Path Patterns

The `routesPath` option supports flexible glob patterns for organizing your handlers:

```typescript
// Standard structure
routesPath: './src/handlers/**/*.ts'

// Controller pattern
routesPath: './src/api/**/*.controller.ts'

// Specific directories
routesPath: './src/endpoints/**/*.ts'

// Multiple patterns (if your build tool supports it)
routesPath: './src/{handlers,endpoints}/**/*.ts'
```

### File Structure Examples

```
# Standard Structure
src/handlers/
├── users.ts              → /users
├── users/{id}.ts         → /users/{id}
└── products/
    ├── index.ts          → /products
    └── {id}/reviews.ts   → /products/{id}/reviews

# Controller Pattern
src/api/
├── users.controller.ts      → /users  
├── user-detail.controller.ts → /user-detail
└── products/
    └── product.controller.ts → /products/product
```
