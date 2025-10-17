---
title: Functional Pattern
description: Using the functional pattern with requirements objects in acai-ts
---

# 🔧 Functional Pattern

Acai-TS supports a **functional pattern** that uses exported functions with a `requirements` object for configuration. This pattern is ideal for developers who prefer a more traditional, configuration-driven approach over decorators.

???+ tip "TypeScript Configuration"
    The functional pattern works with standard TypeScript - no special decorator configuration required.

## 🚀 Quick Start

```typescript
import { Router, Response, Request } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// File: src/handlers/users.ts
// Maps to /users based on file structure

// Define requirements for each HTTP method
export const requirements = {
  get: {
    before: [authMiddleware],
    requiredHeaders: ['x-api-key']
  },
  post: {
    requiredBody: 'CreateUserRequest',
    before: [authMiddleware, validationMiddleware],
    after: [loggingMiddleware],
    timeout: 5000
  }
};

// Define middleware functions
const authMiddleware = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

const validationMiddleware = async (request: Request, response: Response) => {
  // Custom validation logic
};

const loggingMiddleware = async (request: Request, response: Response) => {
  console.log('User operation completed');
};

// Define HTTP method handlers
export const get = async (request: Request, response: Response): Promise<Response> => {
  response.body = { users: [] };
  return response;
};

export const post = async (request: Request, response: Response): Promise<Response> => {
  const user = await createUser(request.body);
  response.code = 201;
  response.body = user;
  return response;
};

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const router = new Router({
    basePath: '/api/v1',
    routesPath: './src/handlers/**/*.ts',
    schemaPath: './openapi.yml' // Optional: OpenAPI validation
  });

  return await router.route(event);
};
```

## 📁 File-Based Routing

The functional pattern uses the same file-based routing as the decorator pattern:

**File Structure → Routes:**
```
src/handlers/
├── users.ts              → /users (GET, POST, PUT, DELETE)
├── users/{id}.ts         → /users/{id} (GET, PUT, DELETE)
└── products/index.ts     → /products
```

**HTTP Methods:**
Export functions matching HTTP method names:
```typescript
// In any handler file
export const get = async (request: Request, response: Response): Promise<Response> => { /* GET handler */ };
export const post = async (request: Request, response: Response): Promise<Response> => { /* POST handler */ };
export const put = async (request: Request, response: Response): Promise<Response> => { /* PUT handler */ };
export const patch = async (request: Request, response: Response): Promise<Response> => { /* PATCH handler */ };
export const delete = async (request: Request, response: Response): Promise<Response> => { /* DELETE handler */ };
```

## 📋 Requirements Object

The `requirements` object defines configuration for each HTTP method:

### 🏠 Basic Structure
```typescript
export const requirements = {
  [httpMethod]: {
    // Configuration options
  }
};
```

### ⚙️ Available Options

#### ✓ Validation
```typescript
export const requirements = {
  post: {
    // OpenAPI schema reference
    requiredBody: 'CreateUserRequest',
    
    // Required headers
    requiredHeaders: ['x-api-key', 'authorization'],
    
    // Required query parameters
    requiredQuery: ['page', 'limit'],
    
    // Direct JSON Schema
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  }
};
```

#### 🛡️ Middleware
```typescript
const middleware1 = async (request: Request, response: Response) => {
  // Pre-processing logic
};

const middleware2 = async (request: Request, response: Response) => {
  // Post-processing logic
};

export const requirements = {
  get: {
    before: [middleware1],        // Runs before handler
    after: [middleware2]          // Runs after handler
  },
  post: {
    before: [middleware1, middleware2], // Multiple middleware (execute in order)
    after: [middleware2]
  }
};
```

#### ⏱️ Timeout
```typescript
export const requirements = {
  post: {
    timeout: 5000    // 5 second timeout
  },
  get: {
    timeout: 30000   // 30 second timeout for heavy operations
  }
};
```

#### 🔐 Authentication
```typescript
export const requirements = {
  get: {
    auth: true    // Requires authentication (uses router's withAuth middleware)
  },
  post: {
    auth: false   // Explicitly disable auth requirement
  }
  // No auth property = no auth requirement
};
```

## 📚 Complete Examples

### 👤 User Management API

```typescript
// File: src/handlers/users.ts
import { Response, Request } from 'acai-ts';

// Middleware functions
const authMiddleware = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

const logRequest = async (request: Request, response: Response) => {
  console.log(`${request.method} ${request.path} - ${new Date().toISOString()}`);
};

const addTimestamp = async (request: Request, response: Response) => {
  if (typeof response.body === 'object') {
    response.body.timestamp = new Date().toISOString();
  }
};

// Requirements configuration
export const requirements = {
  get: {
    before: [logRequest, authMiddleware],
    after: [addTimestamp]
  },
  post: {
    requiredBody: 'CreateUserRequest',
    before: [logRequest, authMiddleware],
    after: [addTimestamp],
    timeout: 5000
  },
  put: {
    requiredBody: 'UpdateUserRequest',
    requiredHeaders: ['authorization'],
    before: [authMiddleware],
    timeout: 10000
  }
};

// HTTP method handlers
export const get = async (request: Request, response: Response): Promise<Response> => {
  const users = await getUserList();
  response.body = { users };
  return response;
};

export const post = async (request: Request, response: Response): Promise<Response> => {
  const user = await createUser(request.body);
  response.code = 201;
  response.body = user;
  return response;
};

export const put = async (request: Request, response: Response): Promise<Response> => {
  const user = await updateUser(request.body);
  response.body = user;
  return response;
};
```

### 🔍 User Detail API

```typescript
// File: src/handlers/users/{id}.ts
import { Response, Request } from 'acai-ts';

const authMiddleware = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

export const requirements = {
  get: {
    before: [authMiddleware]
  },
  put: {
    requiredBody: 'UpdateUserRequest',
    before: [authMiddleware],
    timeout: 5000
  },
  delete: {
    before: [authMiddleware]
  }
};

export const get = async (request: Request, response: Response): Promise<Response> => {
  const user = await getUserById(request.pathParameters.id);
  if (!user) {
    response.code = 404;
    response.setError('user', 'User not found');
    return response;
  }
  response.body = user;
  return response;
};

export const put = async (request: Request, response: Response): Promise<Response> => {
  const user = await updateUser(request.pathParameters.id, request.body);
  response.body = user;
  return response;
};

export const delete = async (request: Request, response: Response): Promise<Response> => {
  await deleteUser(request.pathParameters.id);
  response.code = 204;
  return response;
};
```

## 🌐 Router Configuration

Configure your router to work with functional patterns:

```typescript
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const router = new Router({
  basePath: '/api/v1',
  routesPath: './src/handlers/**/*.ts',  // File-based routing
  schemaPath: './openapi.yml',           // Optional: OpenAPI validation
  timeout: 30000,                        // Default timeout
  outputError: true,
  globalLogger: true,
  withAuth: async (request, response) => { // Global auth middleware
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token || !validateJWT(token)) {
      response.code = 401;
      response.setError('auth', 'Invalid or missing authentication token');
    }
  }
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await router.route(event);
};
```

## 🔄 Middleware Execution Order

When using the functional pattern, middleware executes in this order:

1. **Global middleware** (router-level `beforeAll`)
2. **Auth middleware** (router's `withAuth` if `auth: true`)
3. **Before middleware** (from requirements object)
4. **Validation** (schema validation)
5. **Handler function** (your get/post/put/delete function)
6. **After middleware** (from requirements object)
7. **Global after middleware** (router-level `afterAll`)

```typescript
export const requirements = {
  post: {
    auth: true,                    // 2. Auth middleware
    before: [middleware1, middleware2], // 3. Before middleware (in order)
    requiredBody: 'UserSchema',    // 4. Validation
    after: [middleware3]           // 6. After middleware
    // 5. Handler function runs between before/after
  }
};
```

## 🌟 Best Practices

### 1️⃣ Organize Middleware
```typescript
// Create a middleware directory
// middleware/auth.ts
export const authMiddleware = async (request: Request, response: Response) => {
  // Auth logic
};

// middleware/logging.ts
export const logRequest = async (request: Request, response: Response) => {
  // Logging logic
};

// Import in handlers
import { authMiddleware } from '../middleware/auth';
import { logRequest } from '../middleware/logging';
```

### 2️⃣ Reuse Requirements
```typescript
// common/requirements.ts
export const authRequired = {
  before: [authMiddleware],
  auth: true
};

export const adminRequired = {
  ...authRequired,
  before: [...authRequired.before, adminCheckMiddleware]
};

// In handler files
import { authRequired, adminRequired } from '../common/requirements';

export const requirements = {
  get: authRequired,
  post: adminRequired
};
```

### 3️⃣ Type Safety
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
}

export const post = async (request: Request, response: Response): Promise<Response> => {
  // Type assertion for better TypeScript support
  const userData = request.body as CreateUserRequest;
  
  const user = await createUser(userData);
  response.body = user;
  return response;
};
```

### 4️⃣ Error Handling
```typescript
export const get = async (request: Request, response: Response): Promise<Response> => {
  try {
    const users = await getUserList();
    response.body = { users };
  } catch (error) {
    response.code = 500;
    response.setError('server', 'Failed to fetch users');
  }
  return response;
};
```

## ⚖️ Functional vs Decorator Patterns

### 🔧 When to Use Functional Pattern
- ✅ Prefer configuration over decorators
- ✅ Want to reuse middleware configurations
- ✅ Working with existing JavaScript codebases
- ✅ Team prefers explicit configuration objects
- ✅ Need runtime configuration changes

### 🎨 When to Use Decorator Pattern
- ✅ Love declarative, annotation-style code
- ✅ Want method-level configuration
- ✅ Working in pure TypeScript environments
- ✅ Prefer co-located configuration with methods

### 🔄 Migration Between Patterns

**From Functional to Decorators:**
```typescript
// Before (Functional)
export const requirements = {
  post: {
    auth: true,
    requiredBody: 'CreateUserRequest',
    before: [logRequest],
    timeout: 5000
  }
};

export const post = async (request: Request, response: Response): Promise<Response> => {
  // Handler code
};

// After (Decorators)
export class UsersEndpoint extends BaseEndpoint {
  @Auth()
  @Validate({ requiredBody: 'CreateUserRequest' })
  @Before(logRequest)
  @Timeout(5000)
  async post(request: Request, response: Response): Promise<Response> {
    // Same handler code
  }
}
```

## 📦 Common Patterns

### 📝 CRUD Operations
```typescript
// File: src/handlers/posts.ts
const authAndLog = [authMiddleware, logRequest];

export const requirements = {
  get: {
    before: [logRequest],
    after: [addTimestamp]
  },
  post: {
    requiredBody: 'CreatePostRequest',
    before: authAndLog,
    after: [addTimestamp],
    timeout: 5000
  },
  put: {
    requiredBody: 'UpdatePostRequest', 
    before: authAndLog,
    timeout: 5000
  },
  delete: {
    before: authAndLog
  }
};

export const get = async (request: Request, response: Response): Promise<Response> => {
  const posts = await getPostList();
  response.body = { posts };
  return response;
};

export const post = async (request: Request, response: Response): Promise<Response> => {
  const post = await createPost(request.body);
  response.code = 201;
  response.body = post;
  return response;
};

export const put = async (request: Request, response: Response): Promise<Response> => {
  const post = await updatePost(request.body);
  response.body = post;
  return response;
};

export const delete = async (request: Request, response: Response): Promise<Response> => {
  await deletePost(request.pathParameters.id);
  response.code = 204;
  return response;
};
```

### 🔢 API Versioning
```typescript
// File: src/handlers/v1/users.ts
export const requirements = {
  get: { before: [logRequest] }
};

// File: src/handlers/v2/users.ts  
export const requirements = {
  get: { 
    before: [logRequest, newValidationMiddleware],
    requiredQuery: ['version']
  }
};
```

---

For more examples and advanced patterns, see our [decorator documentation](decorators.md) and [troubleshooting guide](../troubleshooting.md).