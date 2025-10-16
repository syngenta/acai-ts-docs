---
title: Demo
description: Demo & Explanation of Acai-TS
---
# Demo & Explanation of Acai-TS

## Examples Repository

Don't like reading documentation? Check out our working examples:

???+ example "Working Examples"
    All examples are located in the [examples directory](https://github.com/syngenta/acai-ts-docs/tree/main/examples) of this repository.
    
    * **APIGateway with Decorators** - Full decorator-based routing example
    * **APIGateway with Pattern Routing** - Convention over configuration example
    * **DynamoDB Streams** - Process DynamoDB stream events
    * **S3 Events** - Process S3 bucket events
    * **SQS Messages** - Process SQS queue messages

## Quick Start Tutorial

### 1. Install Acai-TS

```bash
npm install acai-ts reflect-metadata
```

### 2. Create Your First Endpoint

```typescript
import 'reflect-metadata';
import { Router, Endpoint, Route, Response, Request } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

@Route('GET', '/hello')
export class HelloEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    response.body = { message: 'Hello, World!' };
    return response;
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const router = new Router({
    basePath: '/api/v1',
    endpoints: [HelloEndpoint]
  });

  return await router.route(event);
};
```

### 3. Add Schema Validation

```typescript
@Route('POST', '/users')
@Validate('CreateUserRequest')
export class CreateUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    // request.body is already validated against your OpenAPI schema
    response.body = { 
      id: '123',
      ...request.body 
    };
    return response;
  }
}
```

### 4. Add Middleware

```typescript
const authMiddleware = async (request: Request) => {
  if (!request.headers.authorization) {
    throw new ApiError('Unauthorized', 401);
  }
};

@Route('GET', '/profile')
@Before(authMiddleware)
export class ProfileEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    response.body = { user: 'profile data' };
    return response;
  }
}
```

## Key Concepts

### Happy Path Programming

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
@Route('POST', '/users')
@Validate('CreateUserRequest')
export class CreateUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    // Body is already validated - just write business logic!
    const user = await this.userService.create(request.body);
    response.body = user;
    return response;
  }
}
```

### TypeScript First

Full type safety throughout:

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

@Route('GET', '/users/{id}')
export class GetUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    const userId: string = request.pathParameters.id;
    const user: User = await this.userRepo.findById(userId);
    
    response.body = user; // Fully typed!
    return response;
  }
}
```

## Next Steps

* [APIGateway Documentation](apigateway/index.md) - Learn about routing, decorators, and request/response handling
* [DynamoDB Events](dynamodb/index.md) - Process DynamoDB stream events
* [S3 Events](s3/index.md) - Process S3 bucket events  
* [SQS Events](sqs/index.md) - Process SQS queue messages
