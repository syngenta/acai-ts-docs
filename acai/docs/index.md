# 🫐 Acai-TS
DRY, configurable, declarative TypeScript library for working with Amazon Web Service Lambdas.

## ✨ Features
* Highly configurable APIGateway internal router with decorator support
* OpenAPI schema adherence for all event types
* Extensible and customizable middleware for validation and other tasks
* DRY coding interfaces without the need of boilerplate
* Full TypeScript support with comprehensive type definitions
* Decorator-based routing (@Route, @Validate, @Before, @After, etc.)
* Pattern-based routing (convention over configuration)
* Ease-of-use with the [serverless framework](https://www.serverless.com/)
* Local development support
* Happy Path Programming (See Philosophy below)

## 💡 Philosophy

The Acai-TS philosophy is to provide a DRY, configurable, declarative library for use with Amazon Lambdas, which encourages Happy Path Programming (HPP).

Happy Path Programming is an idea in which inputs are all validated before operated on. This ensures code follows the happy path without the need for mid-level, nested exceptions and all the nasty exception handling that comes with that. The library uses layers of customizable middleware options to allow a developer to easily dictate what constitutes a valid input, without nested conditionals, try/catch blocks or other coding blocks which distract from the happy path that covers the majority of that code's intended operation.

## 🚀 Quick Example

```typescript
import 'reflect-metadata';
import { Router, BaseEndpoint, Before, After, Timeout, Validate, Response, Request } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// File: src/handlers/users.ts
// The router maps this file to /users based on file structure

// Define middleware
const authMiddleware = async (request: Request, response: Response) => {
  if (!request.headers.authorization) {
    response.code = 401;
    response.setError('auth', 'Unauthorized');
  }
};

// Define your endpoint class with method decorators
export class UsersEndpoint extends BaseEndpoint {
  @Before(authMiddleware)
  @Validate({ requiredBody: 'CreateUserSchema' })
  @Timeout(5000)
  async post(request: Request, response: Response): Promise<Response> {
    // Create user logic
    response.body = {
      id: '123',
      email: request.body.email,
      name: request.body.name
    };
    return response;
  }

  @Before(authMiddleware)
  async get(request: Request, response: Response): Promise<Response> {
    // Get users logic
    response.body = { users: [] };
    return response;
  }
}

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

## 📘 TypeScript First

Acai-TS is the TypeScript evolution of [acai-js](https://github.com/syngenta/acai-js), built from the ground up with type safety and modern TypeScript features in mind.
