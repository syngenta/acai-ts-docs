---
title: Decorators
description: Using decorators with acai-ts for clean, declarative routing
---

# Decorators

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

## Quick Start

```typescript
import 'reflect-metadata';
import { Route, Validate, Auth, Before, After, Timeout } from 'acai-ts';

export class UserController {
  @Route('GET', '/users/:id')
  @Auth(async (request) => {
    // Simple authentication check
    return request.headers.authorization?.startsWith('Bearer ') || false;
  })
  @Timeout(5000)
  async getUser(request: Request, response: Response): Promise<void> {
    response.setBody({ id: request.params.id, name: 'John Doe' });
  }

  @Route('POST', '/users')
  @Validate({
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' }
      }
    }
  })
  @Before(async (request) => {
    console.log('Creating user:', request.body.email);
  })
  @After(async (request, response) => {
    console.log('User created successfully');
  })
  async createUser(request: Request, response: Response): Promise<void> {
    const { name, email } = request.body;
    response.setStatus(201);
    response.setBody({ id: Math.random(), name, email });
  }
}
```

## Available Decorators

### @Route
Defines the HTTP method and path for an endpoint.

```typescript
@Route(method: HttpMethod, path: string)
```

**Parameters:**
- `method`: HTTP method (`'GET'`, `'POST'`, `'PUT'`, `'PATCH'`, `'DELETE'`, etc.)
- `path`: Route path pattern (supports parameters like `/users/:id`)

**Examples:**
```typescript
@Route('GET', '/users')
@Route('POST', '/users')
@Route('PUT', '/users/:id')
@Route('DELETE', '/users/:id')
@Route('GET', '/users/:id/posts/:postId')
```

### @Validate
Adds JSON Schema validation to the request.

```typescript
@Validate(schema: ValidationSchema)
```

**Examples:**
```typescript
// Body validation
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

// Query parameters validation
@Validate({
  query: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  }
})

// Headers validation
@Validate({
  headers: {
    type: 'object',
    required: ['x-api-key'],
    properties: {
      'x-api-key': { type: 'string', minLength: 10 }
    }
  }
})
```

### @Auth
Adds authentication middleware to the endpoint.

```typescript
@Auth(authFunction: (request: Request) => Promise<boolean> | boolean)
```

**Examples:**
```typescript
// Simple token check
@Auth(async (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  return token === 'valid-token-123';
})

// Database user validation
@Auth(async (request) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return false;
  
  const user = await validateUserToken(token);
  return user !== null;
})

// Role-based authentication
@Auth(async (request) => {
  const user = await getCurrentUser(request);
  return user?.role === 'admin';
})
```

### @Before
Adds middleware that runs before the main handler.

```typescript
@Before(middleware: (request: Request, response?: Response) => Promise<void> | void)
```

**Examples:**
```typescript
// Logging
@Before(async (request) => {
  console.log(`${request.method} ${request.path} - ${new Date().toISOString()}`);
})

// Rate limiting
@Before(async (request, response) => {
  const clientIp = request.headers['x-forwarded-for'] || 'unknown';
  if (await isRateLimited(clientIp)) {
    response.setStatus(429);
    response.setError('rate_limit', 'Too many requests');
  }
})

// Data preprocessing
@Before(async (request) => {
  if (request.body?.email) {
    request.body.email = request.body.email.toLowerCase().trim();
  }
})
```

### @After
Adds middleware that runs after the main handler.

```typescript
@After(middleware: (request: Request, response: Response) => Promise<void> | void)
```

**Examples:**
```typescript
// Response logging
@After(async (request, response) => {
  console.log(`Response: ${response.statusCode} for ${request.path}`);
})

// Add security headers
@After(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
})

// Data post-processing
@After(async (request, response) => {
  if (response.body?.users) {
    response.body.users = response.body.users.map(user => ({
      ...user,
      password: undefined // Remove sensitive data
    }));
  }
})
```

### @Timeout
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

## Combining Decorators

Decorators can be combined and will execute in the following order:

1. **@Auth** - Authentication check
2. **@Validate** - Request validation
3. **@Before** - Pre-processing middleware
4. **Handler** - Your main function
5. **@After** - Post-processing middleware
6. **@Timeout** - Applied throughout the entire request

```typescript
export class OrderController {
  @Route('POST', '/orders')
  @Auth(async (request) => await validateUser(request))
  @Validate({
    body: {
      type: 'object',
      required: ['items', 'total'],
      properties: {
        items: { type: 'array', minItems: 1 },
        total: { type: 'number', minimum: 0 }
      }
    }
  })
  @Before(async (request) => {
    request.body.orderId = generateOrderId();
    request.body.timestamp = Date.now();
  })
  @After(async (request, response) => {
    await sendOrderConfirmation(response.body.orderId);
  })
  @Timeout(10000)
  async createOrder(request: Request, response: Response): Promise<void> {
    const order = await processOrder(request.body);
    response.setStatus(201);
    response.setBody(order);
  }
}
```

## Router Configuration for Decorators

When using decorators, your router configuration can be simplified:

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const router = new Router({
  mode: 'list',
  routes: [], // Routes are defined via decorators
  timeout: 30000,
  outputError: true
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await router.route(event);
};
```

## Best Practices

### 1. Keep Decorators Simple
```typescript
// ✅ Good - Simple, focused logic
@Auth(async (request) => Boolean(request.headers.authorization))

// ❌ Avoid - Complex logic in decorators
@Auth(async (request) => {
  // 20 lines of complex authentication logic
  // Better to extract to a separate function
})
```

### 2. Use Multiple @Before/@After for Different Concerns
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

### 3. Consistent Error Handling
```typescript
@Auth(async (request) => {
  try {
    return await validateToken(request.headers.authorization);
  } catch (error) {
    console.error('Auth error:', error);
    return false; // Always return boolean from @Auth
  }
})
```

### 4. Type Safety
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

@Route('POST', '/users')
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
async createUser(request: Request<CreateUserRequest>, response: Response): Promise<void> {
  // TypeScript knows request.body is CreateUserRequest
  const { name, email, age } = request.body;
}
```

## Migration from Functional Approach

### Before (Functional)
```typescript
export const requirements = {
  post: {
    requiredAuth: true,
    requiredBody: 'CreateUserSchema',
    timeout: 5000
  }
};

export const post = async (request: RequestClient, response: ResponseClient) => {
  response.body = { id: 123, ...request.body };
  return response;
};
```

### After (Decorators)
```typescript
export class UserController {
  @Route('POST', '/users')
  @Auth(async (request) => validateUser(request))
  @Validate({ body: CreateUserSchema })
  @Timeout(5000)
  async createUser(request: Request, response: Response): Promise<void> {
    response.setBody({ id: 123, ...request.body });
  }
}
```

## Common Patterns

### CRUD Operations
```typescript
export class UserController {
  @Route('GET', '/users')
  @Auth(requireAuth)
  async listUsers(request: Request, response: Response): Promise<void> {
    const users = await getUserList();
    response.setBody({ users });
  }

  @Route('GET', '/users/:id')
  @Auth(requireAuth)
  async getUser(request: Request, response: Response): Promise<void> {
    const user = await getUserById(request.params.id);
    response.setBody(user);
  }

  @Route('POST', '/users')
  @Auth(requireAdminAuth)
  @Validate({ body: CreateUserSchema })
  async createUser(request: Request, response: Response): Promise<void> {
    const user = await createUser(request.body);
    response.setStatus(201);
    response.setBody(user);
  }

  @Route('PUT', '/users/:id')
  @Auth(requireOwnerOrAdmin)
  @Validate({ body: UpdateUserSchema })
  async updateUser(request: Request, response: Response): Promise<void> {
    const user = await updateUser(request.params.id, request.body);
    response.setBody(user);
  }

  @Route('DELETE', '/users/:id')
  @Auth(requireAdminAuth)
  async deleteUser(request: Request, response: Response): Promise<void> {
    await deleteUser(request.params.id);
    response.setStatus(204);
  }
}
```

---

For more detailed examples and advanced usage patterns, see our [troubleshooting guide](../troubleshooting.md) and the [example code on GitHub](https://github.com/syngenta/acai-ts-docs/tree/main/examples).
