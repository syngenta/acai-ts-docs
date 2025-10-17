---
title: Usage Patterns
description: Choose between functional and decorator patterns in acai-ts
---

# Usage Patterns

Acai-TS offers two powerful patterns for defining API Gateway endpoints, each with its own strengths and ideal use cases.

## Pattern Overview

### 🔧 [Functional Pattern](functional.md)
**Configuration-driven approach using exported functions with requirements objects**

```typescript
// File: src/handlers/users.ts
export const requirements = {
  post: {
    requiredBody: 'CreateUserRequest',
    before: [authMiddleware],
    timeout: 5000
  }
};

export const post = async (request: Request, response: Response): Promise<Response> => {
  // Handler logic
  response.body = { id: '123', ...request.body };
  return response;
};
```

**✅ Best for:**
- Teams who prefer explicit configuration objects
- JavaScript codebases transitioning to TypeScript
- Reusable middleware configurations
- Runtime configuration changes
- Developers familiar with traditional frameworks

---

### 🎨 [Decorator Pattern](decorators.md)
**Annotation-style approach using TypeScript decorators on class methods**

```typescript
// File: src/handlers/users.ts
export class UsersEndpoint extends BaseEndpoint {
  @Validate({ requiredBody: 'CreateUserRequest' })
  @Before(authMiddleware)
  @Timeout(5000)
  async post(request: Request, response: Response): Promise<Response> {
    // Handler logic
    response.body = { id: '123', ...request.body };
    return response;
  }
}
```

**✅ Best for:**
- TypeScript-first development
- Teams who love declarative annotations
- Method-level configuration preferences
- Clean, co-located configuration with handlers
- Modern TypeScript codebases

---

## Key Similarities

Both patterns share the same core features:

- **🗂️ File-based routing** - Routes determined by file structure
- **🔍 Schema validation** - OpenAPI and JSON Schema support
- **🔐 Authentication** - Global and method-level auth controls
- **🔄 Middleware** - Before/after processing hooks
- **⏱️ Timeouts** - Request timeout management
- **📝 Type safety** - Full TypeScript support

## Quick Comparison

| Feature | Functional | Decorators |
|---------|------------|------------|
| **Configuration Style** | Object-based | Annotation-based |
| **TypeScript Required** | No (works with JS) | Yes |
| **Learning Curve** | Lower | Moderate |
| **Runtime Changes** | Easy | Limited |
| **Co-location** | Separate | Inline |
| **Reusability** | High | Moderate |

## File Structure (Both Patterns)

Both patterns use identical file-based routing:

```
src/handlers/
├── users.ts              → /users
├── users/{id}.ts         → /users/{id}
├── products/
│   ├── index.ts          → /products
│   └── {id}/reviews.ts   → /products/{id}/reviews
└── health.ts             → /health
```

## Router Configuration (Both Patterns)

Both patterns use the same router setup:

```typescript
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const router = new Router({
  basePath: '/api/v1',
  routesPath: './src/handlers/**/*.ts',
  schemaPath: './openapi.yml',
  withAuth: async (request, response) => {
    // Global auth middleware
  }
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return await router.route(event);
};
```

## Migration Between Patterns

You can easily migrate between patterns since they're functionally equivalent:

```typescript
// Functional → Decorators
export const requirements = { post: { requiredBody: 'User' } };
export const post = async (req, res) => { /* logic */ };

// Becomes:
export class UsersEndpoint extends BaseEndpoint {
  @Validate({ requiredBody: 'User' })
  async post(req, res) { /* same logic */ }
}
```

## Which Pattern Should You Choose?

### Choose **Functional** if you:
- 🔧 Prefer explicit configuration objects
- 📦 Want maximum reusability of middleware configs
- 🔄 Need runtime configuration changes
- 👥 Have mixed JS/TS team members
- 🏗️ Are migrating from traditional frameworks

### Choose **Decorators** if you:
- 🎨 Love clean, declarative annotations
- 🔗 Want configuration co-located with methods
- 💎 Are building pure TypeScript applications
- 🆕 Starting fresh with modern patterns
- 📝 Prefer method-level configuration visibility

---

## Next Steps

- **[Functional Pattern Guide →](functional.md)** - Learn the requirements object approach
- **[Decorator Pattern Guide →](decorators.md)** - Master TypeScript decorators
- **[Event Processing →](../dynamodb/index.md)** - Handle DynamoDB, S3, and SQS events

Both patterns are powerful and well-supported. Choose based on your team's preferences and project requirements!