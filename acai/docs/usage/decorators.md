---
title: Decorator Pattern
description: Using decorators with acai-ts for clean, declarative routing
---

# 🎨 Decorator Pattern

Acai-TS provides a powerful decorator-based approach for defining routes, middleware, and validation. Decorators offer a clean, declarative way to configure your endpoints without boilerplate code.

???+ tip "TypeScript Configuration Required"
    To use decorators, ensure your `tsconfig.json` includes:
    ```json
    {
      "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "target": "ES2020"
      }
    }
    ```

## 🚀 Quick Start

```typescript
import 'reflect-metadata';
import { BaseEndpoint, Validate, Auth, Before, After, Timeout, Response, Request } from 'acai-ts';

// File: src/handlers/users/{id}.ts
// Maps to GET/PUT/DELETE /users/{id}
export class UserEndpoint extends BaseEndpoint {
  @Auth()
  @Timeout(5000)
  async get(request: Request, response: Response): Promise<Response> {
    response.body = { id: request.pathParameters.id, name: 'John Doe' };
    return response;
  }
}

// File: src/handlers/users.ts  
// Maps to GET/POST /users
export class UsersEndpoint extends BaseEndpoint {
  @Validate({
    requiredBody: 'CreateUserRequest'
  })
  @Before(async (request: Request, response: Response) => {
    console.log('Creating user:', request.body.email);
  })
  @After(async (request: Request, response: Response) => {
    console.log('User created successfully');
  })
  async post(request: Request, response: Response): Promise<Response> {
    const { name, email } = request.body;
    response.code = 201;
    response.body = { id: Math.random(), name, email };
    return response;
  }
}
```

## 🏷️ Available Decorators

### 📁 File-Based Routing (No @Route Decorator)

Acai-TS uses **file-based routing** instead of `@Route` decorators. Routes are determined by your file structure:

**File Structure → Routes:**
```
src/handlers/
├── users.ts              → /users (GET, POST, PUT, DELETE)
├── users/{id}.ts         → /users/{id} (GET, PUT, DELETE)
└── products/index.ts     → /products
```

**HTTP Methods:**
Define methods in your `BaseEndpoint` class:
```typescript
export class UsersEndpoint extends BaseEndpoint {
  async get(request: Request, response: Response): Promise<Response> { /* GET /users */ }
  async post(request: Request, response: Response): Promise<Response> { /* POST /users */ }
  async put(request: Request, response: Response): Promise<Response> { /* PUT /users */ }
  async delete(request: Request, response: Response): Promise<Response> { /* DELETE /users */ }
}
```

### ✓ @Validate
Adds request validation using OpenAPI schemas or JSON Schema.

```typescript
@Validate(validationConfig: ValidationConfig)
```

**Examples:**
```typescript
// OpenAPI schema reference
@Validate({ requiredBody: 'CreateUserRequest' })

// Required headers
@Validate({ requiredHeaders: ['x-api-key', 'authorization'] })

// Required query parameters  
@Validate({ requiredQuery: ['page', 'limit'] })

// Direct JSON Schema
@Validate({
  body: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 50 },
      email: { type: 'string', format: 'email' }
    }
  }
})

// Multiple validations
@Validate({
  requiredBody: 'CreateUserRequest',
  requiredHeaders: ['authorization']
})
```

### 🔐 @Auth
Marks a method as requiring authentication using the router's global `withAuth` middleware.

```typescript
@Auth(required?: boolean)
```

**Setup Router with Auth Middleware:**
```typescript
const router = new Router({
  basePath: '/api/v1',
  routesPath: './src/handlers/**/*.ts',
  withAuth: async (request: Request, response: Response) => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token || !validateJWT(token)) {
      response.code = 401;
      response.setError('auth', 'Invalid or missing authentication token');
    }
  }
});
```

**Examples:**
```typescript
export class UsersEndpoint extends BaseEndpoint {
  @Auth()  // Requires authentication (default: required=true)
  async get(request: Request, response: Response): Promise<Response> {
    response.body = { users: [] };
    return response;
  }

  @Auth(false)  // Explicitly disable auth requirement
  async post(request: Request, response: Response): Promise<Response> {
    response.body = { message: 'Public endpoint' };
    return response;
  }

  // No @Auth decorator = no auth requirement
  async options(request: Request, response: Response): Promise<Response> {
    response.body = { message: 'CORS preflight' };
    return response;
  }
}
```

### ⬅️ @Before
Adds middleware that runs before the main handler.

```typescript
@Before(middleware1, middleware2, ...)
```

**Examples:**
```typescript
// Single middleware
const logRequest = async (request: Request, response: Response) => {
  console.log(`${request.method} ${request.path} - ${new Date().toISOString()}`);
};

@Before(logRequest)
async get(request: Request, response: Response): Promise<Response> {
  // Handler code
}

// Multiple middlewares (execute in order)
const rateLimiter = async (request: Request, response: Response) => {
  const clientIp = request.headers['x-forwarded-for'] || 'unknown';
  if (await isRateLimited(clientIp)) {
    response.code = 429;
    response.setError('rate_limit', 'Too many requests');
  }
};

const authCheck = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

@Before(rateLimiter, authCheck)  // Executes: rateLimiter → authCheck → handler
async post(request: Request, response: Response): Promise<Response> {
  // Handler code
}
```

### ➡️ @After
Adds middleware that runs after the main handler.

```typescript
@After(middleware1, middleware2, ...)
```

**Examples:**
```typescript
// Single middleware
const addTimestamp = async (request: Request, response: Response) => {
  response.body.timestamp = new Date().toISOString();
};

@After(addTimestamp)
async get(request: Request, response: Response): Promise<Response> {
  response.body = { data: 'value' };
  return response;
}

// Multiple middlewares (execute in order)
const addSecurityHeaders = async (request: Request, response: Response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
};

const sanitizeResponse = async (request: Request, response: Response) => {
  if (response.body?.users) {
    response.body.users = response.body.users.map(user => ({
      ...user,
      password: undefined // Remove sensitive data
    }));
  }
};

@After(addSecurityHeaders, sanitizeResponse)  // Executes: handler → addSecurityHeaders → sanitizeResponse
async get(request: Request, response: Response): Promise<Response> {
  // Handler code
}
```

### ⏱️ @Timeout
Sets a timeout for the endpoint.

```typescript
@Timeout(milliseconds: number)
```

**Examples:**
```typescript
@Timeout(5000)  // 5 second timeout
@Timeout(30000) // 30 second timeout for heavy operations
@Timeout(1000)  // 1 second timeout for quick operations
```

## 🤝 Combining Decorators

Decorators can be combined and will execute in the following order:

1. **@Before** - Custom middleware (runs first)
2. **@Auth** - Authentication check (router's `withAuth` middleware)
3. **@Validate** - Request validation
4. **Handler** - Your main function with `@Timeout`
5. **@After** - Post-processing middleware

```typescript
// File: src/handlers/orders.ts
const enrichOrder = async (request: Request, response: Response) => {
  request.body.orderId = generateOrderId();
  request.body.timestamp = Date.now();
};

const sendConfirmation = async (request: Request, response: Response) => {
  await sendOrderConfirmation(response.body.orderId);
};

export class OrdersEndpoint extends BaseEndpoint {
  @Before(enrichOrder)        // Runs first
  @Auth()                     // Auth middleware runs after Before
  @Validate({                 // Validates request
    requiredBody: 'CreateOrderRequest'
  })
  @Timeout(10000)            // Sets timeout
  @After(sendConfirmation)   // Runs last
  async post(request: Request, response: Response): Promise<Response> {
    const order = await processOrder(request.body);
    response.code = 201;
    response.body = order;
    return response;
  }
}
```

## 🌐 Router Configuration for Decorators

Configure your router for file-based routing with decorators:

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const router = new Router({
  basePath: '/api/v1',
  routesPath: './src/handlers/**/*.ts',  // File-based routing
  schemaPath: './openapi.yml',           // Optional: OpenAPI validation
  timeout: 30000,
  outputError: true,
  withAuth: async (request, response) => { // Global auth middleware
    // Your JWT validation logic here
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

## 🌟 Best Practices

### 1️⃣ Keep Auth Simple
```typescript
// ✅ Good - Use @Auth as boolean flag
@Auth()  // Uses router's withAuth middleware
@Auth(false)  // Explicitly disable auth

// ❌ Avoid - @Auth doesn't take functions (that's the old API)
// @Auth(async (request) => { /* complex logic */ })
// Instead, put complex logic in router's withAuth middleware
```

### 2️⃣ Use Multiple @Before/@After for Different Concerns
```typescript
// ✅ Good - Separate concerns
@Before(logRequest)
@Before(validateBusinessRules)
@Before(enrichRequestData)

// ❌ Avoid - Single decorator doing everything
@Before(async (request) => {
  // logging + validation + enrichment all in one
})
```

### 3️⃣ Consistent Error Handling
```typescript
// Handle errors in middleware functions
const authMiddleware = async (request: Request, response: Response) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token || !await validateToken(token)) {
      response.code = 401;
      response.setError('auth', 'Invalid authentication');
    }
  } catch (error) {
    console.error('Auth error:', error);
    response.code = 401;
    response.setError('auth', 'Authentication failed');
  }
};

@Before(authMiddleware)  // Use in @Before instead of @Auth for complex logic
```

### 4️⃣ Type Safety
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

// File: src/handlers/users.ts
export class UsersEndpoint extends BaseEndpoint {
  @Validate({
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 }
      }
    }
  })
  async post(request: Request, response: Response): Promise<Response> {
    // TypeScript knows request.body is CreateUserRequest when properly typed
    const { name, email, age } = request.body as CreateUserRequest;
    response.body = { id: 123, name, email, age };
    return response;
  }
}
```

## 🔄 Migration from Functional Approach

### 🔴 Before (Functional Pattern)
```typescript
export const requirements = {
  post: {
    before: [authMiddleware],
    requiredBody: 'CreateUserSchema',
    timeout: 5000
  }
};

export const post = async (request: Request, response: Response) => {
  response.body = { id: 123, ...request.body };
  return response;
};
```

### 🟢 After (Class-Based with Decorators)
```typescript
// File: src/handlers/users.ts
export class UsersEndpoint extends BaseEndpoint {
  @Auth()  // Uses router's withAuth middleware
  @Validate({ requiredBody: 'CreateUserSchema' })
  @Timeout(5000)
  async post(request: Request, response: Response): Promise<Response> {
    response.body = { id: 123, ...request.body };
    return response;
  }
}
```

## 📦 Common Patterns

### 📝 CRUD Operations
```typescript
// File: src/handlers/users.ts - Handles /users
export class UsersEndpoint extends BaseEndpoint {
  @Auth()
  async get(request: Request, response: Response): Promise<Response> {
    const users = await getUserList();
    response.body = { users };
    return response;
  }

  @Auth()
  @Validate({ requiredBody: 'CreateUserSchema' })
  async post(request: Request, response: Response): Promise<Response> {
    const user = await createUser(request.body);
    response.code = 201;
    response.body = user;
    return response;
  }
}

// File: src/handlers/users/{id}.ts - Handles /users/{id}
export class UserEndpoint extends BaseEndpoint {
  @Auth()
  async get(request: Request, response: Response): Promise<Response> {
    const user = await getUserById(request.pathParameters.id);
    response.body = user;
    return response;
  }

  @Auth()
  @Validate({ requiredBody: 'UpdateUserSchema' })
  async put(request: Request, response: Response): Promise<Response> {
    const user = await updateUser(request.pathParameters.id, request.body);
    response.body = user;
    return response;
  }

  @Auth()
  async delete(request: Request, response: Response): Promise<Response> {
    await deleteUser(request.pathParameters.id);
    response.code = 204;
    return response;
  }
}
```

---

For more detailed examples and advanced usage patterns, see our [troubleshooting guide](../troubleshooting.md) and the [example code on GitHub](https://github.com/syngenta/acai-ts-docs/tree/main/examples).
