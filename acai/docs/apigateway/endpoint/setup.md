---
title: Set Up
description: How to set up an endpoint for the Acai
---

# Endpoint Set Up

Acai-TS supports two patterns for defining endpoints: **functional pattern** (using exported functions with requirements) and **decorator pattern** (using classes with method decorators). Both approaches follow the "Happy Path Programming" philosophy where validation happens upfront, ensuring your business logic runs cleanly without defensive coding.

???+ tip "Choose Your Pattern"
    - **Functional Pattern**: Best for explicit configuration objects and JavaScript/TypeScript mixed codebases
    - **Decorator Pattern**: Best for TypeScript-first development with declarative annotations

???+ examples
    Don't like reading documentation? Then look at [our examples,](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!

## Functional Pattern

### 1. Match Function to HTTP Method

Each endpoint file exports functions matching HTTP method names. When an endpoint receives a `POST` request, the `post` function is invoked.

```typescript
// File: src/handlers/grower.ts
import { Request, Response } from 'acai-ts';

export const requirements = {}; // discussed in next section below

export const post = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[POST] /grower was called' };
    return response;
};

export const get = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[GET] /grower was called' };
    return response;
};

export const patch = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[PATCH] /grower was called' };
    return response;
};

export const put = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[PUT] /grower was called' };
    return response;
};

export const delete = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[DELETE] /grower was called' };
    return response;
};

export const query = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[QUERY] /grower, a custom http method, was called' };
    return response;
};
```

### 2. Configure the Requirements (optional)

Each method within the endpoint file can have individual validation requirements. These requirements allow you to test all structural points of the request, with the ability to use JSONSchema and custom middleware to further extend the validation options. Below is an example of a full requirements object:

???+ info
    See the full configuration list, explanation and example of each setting in our [Configurations Section]({{web.url}}/node/apigateway/endpoint/configurations/).

???+ tip
    If you are already using an `openapi.yml`, none of these requirements below are necessary. Ensure your `router` has enabled [`autoValidate`]({{web.url}}/node/apigateway/router/configurations/#example-router-config-with-directory-routing) with proper `schemaPath` configured and the below requirements are not necessary for any basic structural validation (headers, body, query, params will be checked via openapi.yml). You can still use `before`, `after` & `dataClass` with other custom validations for more advanced use cases.

```typescript
// File: src/handlers/grower.ts
import { Request, Response } from 'acai-ts';
import { Grower } from './logic/grower';
import * as db from './logic/database';

// Middleware functions
const checkGrowerExists = async (request: Request, response: Response): Promise<void> => {
    const result = await db.checkGrowerIdExists(request.pathParameters.id);
    if (!result) {
        response.code = 404;
        response.setError('grower', `grower with id: ${request.pathParameters.id} does not exist.`);
    }
};

const filterByRelations = async (request: Request, response: Response): Promise<void> => {
    const relations = await db.getRequesterRelations(request.headers['x-requester-id']);
    const results: any[] = [];
    for (const grower of response.body) {
        if (relations.includes(grower.id)) {
            results.push(grower);
        }
    }
    response.body = results;
};

export const requirements = {
    post: {
        requiredHeaders: ['x-onbehalf-of'],
        requiredBody: 'post-grower-request'
    },
    get: {
        requiredQuery: ['requester_id']
    },
    put: {
        auth: true,
        requiredBody: 'put-grower-request',
        timeout: 1500 // will override timeout value set in router config
    },
    patch: {
        auth: true,
        requiredBody: 'patch-grower-request',
        before: [checkGrowerExists]
    },
    delete: {
        after: [filterByRelations]
    }
};

export const post = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[POST] /grower was called' };
    return response;
};

export const get = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[GET] /grower was called' };
    return response;
};

export const patch = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[PATCH] /grower was called' };
    return response;
};

export const put = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[PUT] /grower was called' };
    return response;
};

export const delete = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[DELETE] /grower was called' };
    return response;
};

export const query = async (request: Request, response: Response): Promise<Response> => {
    response.body = { message: '[QUERY] /grower, a custom http method, was called' };
    return response;
};
```

---

## Decorator Pattern

### 1. Create Class Extending BaseEndpoint

The decorator pattern uses classes that extend `BaseEndpoint` with method decorators for configuration.

```typescript
// File: src/handlers/grower.ts
import 'reflect-metadata';
import { BaseEndpoint, Request, Response } from 'acai-ts';

export class GrowerEndpoint extends BaseEndpoint {
    async post(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[POST] /grower was called' };
        return response;
    }

    async get(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[GET] /grower was called' };
        return response;
    }

    async patch(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[PATCH] /grower was called' };
        return response;
    }

    async put(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[PUT] /grower was called' };
        return response;
    }

    async delete(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[DELETE] /grower was called' };
        return response;
    }

    async query(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[QUERY] /grower, a custom http method, was called' };
        return response;
    }
}
```

### 2. Add Method Decorators (optional)

Use decorators to configure validation, authentication, middleware, and timeouts for each HTTP method.

```typescript
// File: src/handlers/grower.ts
import 'reflect-metadata';
import { BaseEndpoint, Validate, Auth, Before, After, Timeout, Request, Response } from 'acai-ts';
import { Grower } from './logic/grower';
import * as db from './logic/database';

// Middleware functions
const checkGrowerExists = async (request: Request, response: Response): Promise<void> => {
    const result = await db.checkGrowerIdExists(request.pathParameters.id);
    if (!result) {
        response.code = 404;
        response.setError('grower', `grower with id: ${request.pathParameters.id} does not exist.`);
    }
};

const filterByRelations = async (request: Request, response: Response): Promise<void> => {
    const relations = await db.getRequesterRelations(request.headers['x-requester-id']);
    const results: any[] = [];
    for (const grower of response.body) {
        if (relations.includes(grower.id)) {
            results.push(grower);
        }
    }
    response.body = results;
};

const logRequest = async (request: Request, response: Response): Promise<void> => {
    console.log(`${request.method} ${request.path} - ${new Date().toISOString()}`);
};

export class GrowerEndpoint extends BaseEndpoint {
    @Validate({ requiredHeaders: ['x-onbehalf-of'], requiredBody: 'post-grower-request' })
    @Before(logRequest)
    async post(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[POST] /grower was called' };
        return response;
    }

    @Validate({ requiredQuery: ['requester_id'] })
    @Before(logRequest)
    async get(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[GET] /grower was called' };
        return response;
    }

    @Auth()
    @Validate({ requiredBody: 'patch-grower-request' })
    @Before(checkGrowerExists)
    @Before(logRequest)
    async patch(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[PATCH] /grower was called' };
        return response;
    }

    @Auth()
    @Validate({ requiredBody: 'put-grower-request' })
    @Before(logRequest)
    @Timeout(1500)
    async put(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[PUT] /grower was called' };
        return response;
    }

    @Before(logRequest)
    @After(filterByRelations)
    async delete(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[DELETE] /grower was called' };
        return response;
    }

    async query(request: Request, response: Response): Promise<Response> {
        response.body = { message: '[QUERY] /grower, a custom http method, was called' };
        return response;
    }
}
```

### Available Decorators

| Decorator | Purpose | Example |
|-----------|---------|----------|
| `@Validate()` | Request validation | `@Validate({ requiredBody: 'UserSchema' })` |
| `@Auth()` | Authentication required | `@Auth()` or `@Auth(false)` |
| `@Before()` | Pre-processing middleware | `@Before(authMiddleware, loggingMiddleware)` |
| `@After()` | Post-processing middleware | `@After(loggingMiddleware)` |
| `@Timeout()` | Method timeout | `@Timeout(5000)` |

### Decorator Execution Order

1. `@Before` middleware (runs first)
2. `@Auth` authentication (router's `withAuth` middleware)
3. `@Validate` validation
4. HTTP method with `@Timeout`
5. `@After` middleware (runs last)

---

## Pattern Comparison

| Feature | Functional Pattern | Decorator Pattern |
|---------|-------------------|-------------------|
| **Configuration** | `requirements` object | Method decorators |
| **TypeScript Required** | No | Yes |
| **File Structure** | Export functions | Export class |
| **Middleware** | Arrays in requirements | Multiple decorators |
| **Reusability** | High (shared requirements) | Moderate |
| **Co-location** | Separate from methods | Inline with methods |
