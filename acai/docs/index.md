# Acai-TS
DRY, configurable, declarative TypeScript library for working with Amazon Web Service Lambdas.

## Features
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

## Philosophy

The Acai-TS philosophy is to provide a DRY, configurable, declarative library for use with Amazon Lambdas, which encourages Happy Path Programming (HPP).

Happy Path Programming is an idea in which inputs are all validated before operated on. This ensures code follows the happy path without the need for mid-level, nested exceptions and all the nasty exception handling that comes with that. The library uses layers of customizable middleware options to allow a developer to easily dictate what constitutes a valid input, without nested conditionals, try/catch blocks or other coding blocks which distract from the happy path that covers the majority of that code's intended operation.

## Quick Example

```typescript
import 'reflect-metadata';
import { Router, Endpoint, Route, Validate, Response, Request } from 'acai-ts';

@Route('POST', '/users')
@Validate('CreateUserSchema')
export class CreateUserEndpoint extends Endpoint {
  async handler(request: Request, response: Response) {
    // Body is already validated - focus on business logic!
    response.body = {
      id: '123',
      email: request.body.email,
      name: request.body.name
    };
    return response;
  }
}
```

## TypeScript First

Acai-TS is the TypeScript evolution of [acai-js](https://github.com/syngenta/acai-js), built from the ground up with type safety and modern TypeScript features in mind.
