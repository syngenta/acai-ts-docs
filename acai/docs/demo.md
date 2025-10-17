---
title: Demo
description: Demo & Explanation of Acai-TS
---
# 🎪 Demo & Explanation of Acai-TS

## 📚 Examples Repository

Don't like reading documentation? Check out our working examples:

???+ example "Working Examples"
    All examples are located in the [examples directory](https://github.com/syngenta/acai-ts-docs/tree/main/examples) of this repository.
    
    * **APIGateway with Decorators** - Full decorator-based routing example
    * **APIGateway with Pattern Routing** - Convention over configuration example
    * **DynamoDB Streams** - Process DynamoDB stream events
    * **S3 Events** - Process S3 bucket events
    * **SQS Messages** - Process SQS queue messages

## 🚀 Quick Start Tutorial

### 1️⃣ Install Acai-TS

```bash
npm install acai-ts reflect-metadata
```

### 2️⃣ Create Your First Endpoint

```typescript
import 'reflect-metadata';
import { Router, BaseEndpoint, Response, Request } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// File: src/handlers/hello.ts
export class HelloEndpoint extends BaseEndpoint {
  async get(request: Request, response: Response): Promise<Response> {
    response.body = { message: 'Hello, World!' };
    return response;
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const router = new Router({
    basePath: '/api/v1',
    routesPath: './src/handlers/**/*.ts'
  });

  return await router.route(event);
};
```

### 3️⃣ Add Schema Validation

```typescript
// File: src/handlers/users.ts
import { BaseEndpoint, Validate, Response, Request } from 'acai-ts';

export class UsersEndpoint extends BaseEndpoint {
  @Validate({ requiredBody: 'CreateUserRequest' })
  async post(request: Request, response: Response): Promise<Response> {
    // request.body is already validated against your OpenAPI schema
    response.body = { 
      id: '123',
      ...request.body 
    };
    return response;
  }
}
```

### 4️⃣ Add Middleware

```typescript
// File: src/handlers/profile.ts
import { BaseEndpoint, Before, Response, Request } from 'acai-ts';

const authMiddleware = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

export class ProfileEndpoint extends BaseEndpoint {
  @Before(authMiddleware)
  async get(request: Request, response: Response): Promise<Response> {
    response.body = { user: 'profile data' };
    return response;
  }
}
```

## 💡 Key Concepts

### 🎆 Happy Path Programming

Acai-TS embraces **Happy Path Programming** - validation happens upfront, so your business logic runs cleanly:

```typescript
// ❌ Without Acai-TS: Defensive coding everywhere
export const handler = async (event: any) => {
  try {
    if (!event.body) throw new Error('No body');
    const body = JSON.parse(event.body);
    if (!body.email) throw new Error('Email required');
    // Finally, business logic...
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error }) };
  }
};

// ✅ With Acai-TS: Validation handled, focus on logic
export class CreateUserEndpoint extends BaseEndpoint {
  @Validate({ requiredBody: 'CreateUserRequest' })
  async post(request: Request, response: Response): Promise<Response> {
    // Body is already validated - just write business logic!
    const user = await this.userService.create(request.body);
    response.body = user;
    return response;
  }
}
```

### 📘 TypeScript First

Full type safety throughout:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

// File: src/handlers/users/{id}.ts
export class UserEndpoint extends BaseEndpoint {
  async get(request: Request, response: Response): Promise<Response> {
    const userId: string = request.pathParameters.id;
    const user: User = await this.userRepo.findById(userId);
    
    response.body = user; // Fully typed!
    return response;
  }
}
```

## 📍 Next Steps

* [APIGateway Documentation](apigateway/index.md) - Learn about routing, decorators, and request/response handling
* [DynamoDB Events](dynamodb/index.md) - Process DynamoDB stream events
* [S3 Events](s3/index.md) - Process S3 bucket events  
* [SQS Events](sqs/index.md) - Process SQS queue messages
