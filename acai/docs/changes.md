---
title: Migration from acai-js
description: Migrating from acai-js to acai-ts
---

## Migration Guide: acai-js to acai-ts

Acai-TS is a complete TypeScript rewrite of acai-js with improved type safety, decorator support, and modern ES6+ features. This guide will help you migrate your existing acai-js code to acai-ts.

???+ tip "Quick Start"
    The main changes are:
    
    1. Install `acai-ts` and `reflect-metadata`
    2. Convert JavaScript to TypeScript
    3. Update imports to use ES6 modules
    4. Add type annotations
    5. Use decorators for cleaner endpoint definitions (optional)

## Installation Changes

### Before (acai-js)
```bash
npm install acai-js
```

### After (acai-ts)
```bash
npm install acai-ts reflect-metadata
```

**New Requirements:**
- Node.js >= 18.18.2
- TypeScript >= 5.0
- `reflect-metadata` package (for decorator support)

## Import Changes

### Before (acai-js)
```javascript
const { Router, Event } = require('acai-js');
```

### After (acai-ts)
```typescript
import 'reflect-metadata';
import { Router, Event } from 'acai-ts';
import { APIGatewayProxyEvent, DynamoDBStreamEvent } from 'aws-lambda';
```

## TypeScript Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## APIGateway Router Changes

### Before (acai-js)
```javascript
const { Router } = require('acai-js');

exports.handler = async (event) => {
  const router = new Router({
    basePath: '/api/v1',
    schemaPath: './openapi.yml'
  });
  
  return await router.route(event);
};
```

### After (acai-ts)
```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const router = new Router({
    basePath: '/api/v1',
    schemaPath: './openapi.yml'
  });
  
  return await router.route(event);
};
```

## Endpoint Changes

### Pattern-Based (File-Based) Routing

#### Before (acai-js)
```javascript
// users.js
exports.requirements = {
  post: {
    requiredBody: 'CreateUserRequest'
  }
};

exports.post = async (request, response) => {
  response.body = { id: '123', ...request.body };
  return response;
};
```

#### After (acai-ts)
```typescript
// users.ts
import { RequestClient, ResponseClient, EndpointRequirements } from 'acai-ts';

export const requirements: EndpointRequirements = {
  post: {
    requiredBody: 'CreateUserRequest'
  }
};

export const post = async (
  request: RequestClient, 
  response: ResponseClient
): Promise<ResponseClient> => {
  response.body = { id: '123', ...request.body };
  return response;
};
```

### Decorator-Based Routing (NEW in acai-ts!)

```typescript
import { Endpoint, Route, Validate, Response, Request } from 'acai-ts';

@Route('POST', '/users')
@Validate('CreateUserRequest')
export class CreateUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    response.body = { id: '123', ...request.body };
    return response;
  }
}
```

## Event Handler Changes

### DynamoDB Streams

#### Before (acai-js)
```javascript
const { Event } = require('acai-js');

exports.handler = async (event) => {
  const dynamodb = new Event(event, {
    operations: ['INSERT', 'MODIFY']
  });
  
  for (const record of dynamodb.records) {
    console.log(record.newImage);
  }
};
```

#### After (acai-ts)
```typescript
import { Event } from 'acai-ts';
import { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const dynamodb = new Event(event, {
    operations: ['INSERT', 'MODIFY']
  });
  
  for (const record of dynamodb.records) {
    console.log(record.newImage);
  }
};
```

### S3 Events

#### Before (acai-js)
```javascript
const { Event } = require('acai-js');

exports.handler = async (event) => {
  const s3Event = new Event(event, {
    getObject: true,
    isJSON: true
  });
  
  await s3Event.process();
  
  for (const record of s3Event.records) {
    console.log(record.body);
  }
};
```

#### After (acai-ts)
```typescript
import { Event } from 'acai-ts';
import { S3Event } from 'aws-lambda';

export const handler = async (event: S3Event): Promise<void> => {
  const s3Event = new Event(event, {
    getObject: true,
    isJSON: true
  });
  
  await s3Event.process();
  
  for (const record of s3Event.records) {
    console.log(record.body);
  }
};
```

### SQS Messages

#### Before (acai-js)
```javascript
const { Event } = require('acai-js');

exports.handler = async (event) => {
  const sqsEvent = new Event(event);
  
  for (const record of sqsEvent.records) {
    console.log(record.body);
  }
};
```

#### After (acai-ts)
```typescript
import { Event } from 'acai-ts';
import { SQSEvent } from 'aws-lambda';

export const handler = async (event: SQSEvent): Promise<void> => {
  const sqsEvent = new Event(event);
  
  for (const record of sqsEvent.records) {
    console.log(record.body);
  }
};
```

## Logger Changes

### Before (acai-js)
```javascript
global.logger.info('message');
global.logger.error('error');
```

### After (acai-ts)
```typescript
import { Logger } from 'acai-ts';

Logger.info('message');
Logger.error('error');
```

## New Features in acai-ts

### 1. Decorator Support
Use decorators for cleaner endpoint definitions:

```typescript
@Route('POST', '/users')
@Validate('CreateUserRequest')
@Before(authMiddleware)
@After(loggingMiddleware)
@Timeout(30000)
export class CreateUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    // Clean business logic
  }
}
```

### 2. Full TypeScript Type Safety
All classes, interfaces, and functions are fully typed:

```typescript
import { RequestClient, ResponseClient } from 'acai-ts';

const request: RequestClient = {
  path: '/users',
  method: 'POST',
  body: { email: 'user@example.com' },
  headers: {},
  queryParameters: {},
  pathParameters: {}
};
```

### 3. Custom Data Classes with Types
```typescript
interface UserData {
  id: string;
  email: string;
}

class User {
  id: string;
  email: string;

  constructor(record: any) {
    this.id = record.body.id;
    this.email = record.body.email;
  }

  sendWelcomeEmail(): void {
    // Type-safe method
  }
}

const dynamodb = new Event<User>(event, {
  dataClass: User,
  operations: ['INSERT']
});

for (const user of dynamodb.records) {
  user.sendWelcomeEmail(); // Fully typed!
}
```

### 4. Improved Error Handling
```typescript
import { ApiError } from 'acai-ts';

throw new ApiError('User not found', 404, 'user_id');
```

## API Compatibility

Most APIs remain compatible, but with added type safety:

| acai-js | acai-ts | Notes |
|---------|---------|-------|
| `Router` | `Router` | Same API, now typed |
| `Event` | `Event` | Same API, now typed |
| `Request` | `RequestClient` / `Request` | Typed interface |
| `Response` | `ResponseClient` / `Response` | Typed interface |
| `global.logger` | `Logger` | Import from package |

## Breaking Changes

### 1. Package Name
- **Old**: `acai-js` or `@syngenta-digital/Acai`
- **New**: `acai-ts`

### 2. Node.js Version
- **Old**: Node 10.10+
- **New**: Node 18.18.2+

### 3. File Extensions
- **Old**: `.js` files
- **New**: `.ts` files

### 4. Export Syntax
- **Old**: `exports.handler`
- **New**: `export const handler`

### 5. Import Syntax
- **Old**: `require()`
- **New**: `import` statements

## Migration Checklist

- [ ] Install `acai-ts` and `reflect-metadata`
- [ ] Update `tsconfig.json` with decorator support
- [ ] Convert `.js` files to `.ts`
- [ ] Change `require()` to `import` statements
- [ ] Change `exports.` to `export const`
- [ ] Add AWS Lambda event types
- [ ] Add type annotations to functions
- [ ] Update `acai-js` imports to `acai-ts`
- [ ] Add `import 'reflect-metadata'` at entry points
- [ ] Test all endpoints and event handlers
- [ ] Update deployment configuration for TypeScript build

## Need Help?

- [GitHub Issues](https://github.com/syngenta/acai-ts/issues)
- [Examples Repository](https://github.com/syngenta/acai-ts-docs/tree/main/examples)
- [API Documentation](apigateway/index.md)
