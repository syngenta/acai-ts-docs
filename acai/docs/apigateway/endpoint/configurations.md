---
title: Configurations
description: How to use the built-in validation & custom middleware
---

# Endpoint Configurations

In order to encourage "Happy Path Programming" and make it easier for developers to validate request fully, the Acai comes with a host of built-in validations as well as the ability to extend with custom validations and middleware. See the full validation list here:

???+ examples
    Don't like reading documentation? Then look at [our examples,](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!

### Validation Configurations

| requirement                                                                                | type     | description                                                   |
|--------------------------------------------------------------------------------------------|----------|---------------------------------------------------------------|
| **[`requiredHeaders`]({{web.url}}/apigateway/endpoint/configurations/#requiredheaders)**   | array    | every header in this array must be in the headers of request  |
| **[`availableHeaders`]({{web.url}}/apigateway/endpoint/configurations/#availableheaders)** | array    | only headers in this array will be allowed in the request     |
| **[`requiredQuery`]({{web.url}}/apigateway/endpoint/configurations/#requiredquery)**       | array    | every item in the array is a required query string parameter  |
| **[`availableQuery`]({{web.url}}/apigateway/endpoint/configurations/#availablequery)**     | array    | only items in this array are allowed in the request           |
| **[`requiredPath`]({{web.url}}/apigateway/endpoint/configurations/#requiredpath)**         | string   | when using parameters, this is the required parameters        |
| **[`requiredBody`]({{web.url}}/apigateway/endpoint/configurations/#requiredbody)**         | string   | references a JSschema component in your `schemaFile`          |
| **[`requiredResposne`]({{web.url}}/apigateway/endpoint/configurations/#requiredResponse)** | string   | references a JSschema component in your `schemaFile`          |
| **[`requiredAuth`]({{web.url}}/apigateway/endpoint/configurations/#requiredauth)**         | boolean  | will trigger `withAuth` function defined in the router config |
| **[`before`]({{web.url}}/apigateway/endpoint/configurations/#before)**                     | function | a custom function to be ran before your method function       |
| **[`after`]({{web.url}}/apigateway/endpoint/configurations/#after)**                       | function | a custom function to be ran after your method function        |
| **[`dataClass`]({{web.url}}/apigateway/endpoint/configurations/#dataclass)**               | class    | a custom class that will be passed instead of the request obj |
| **[`timeout`]({{web.url}}/apigateway/endpoint/configurations/#timeout)**                   | number   | a timeout value in microseconds to stop endpoint from running |
| **[`custom-requirement`]**                                                                 | any      | see bottom of page                                            |

#### `requiredHeaders`

???+ info
    Headers are case-sensitive, make sure your casing matches your expectations.

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            requiredHeaders: ['x-onbehalf-of']
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ requiredHeaders: ['x-onbehalf-of'] })
        async post(request: Request, response: Response): Promise<Response> {
            // Headers are validated automatically
            response.body = { message: 'Headers validated' };
            return response;
        }
    }
    ```

#### `availableHeaders`

???+ warning
    This is not recommended for frequent use as it raises errors for every header which does not conform to the array provided. Many browsers, http tools, and libraries will automatically add headers to request, unbeknownst to the user. By using this setting, you will force every user of the endpoint to take extra care with the headers provided and may result in poor API consumer experience.

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            availableHeaders: ['x-onbehalf-of']
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ 
            headers: {
                type: 'object',
                additionalProperties: false, // Only allow specified headers
                properties: {
                    'x-onbehalf-of': { type: 'string' }
                }
            }
        })
        async post(request: Request, response: Response): Promise<Response> {
            response.body = { message: 'Only specified headers allowed' };
            return response;
        }
    }
    ```

#### `requiredQuery`

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        get: {
            requiredQuery: ['requester_id']
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ requiredQuery: ['requester_id'] })
        async get(request: Request, response: Response): Promise<Response> {
            const requesterId = request.queryParameters.requester_id;
            response.body = { requesterId };
            return response;
        }
    }
    ```

#### `availableQuery`

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        get: {
            availableQuery: ['grower_email', 'grower_phone', 'grower_first', 'grower_last']
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ 
            query: {
                type: 'object',
                additionalProperties: false, // Only allow specified query params
                properties: {
                    grower_email: { type: 'string' },
                    grower_phone: { type: 'string' },
                    grower_first: { type: 'string' },
                    grower_last: { type: 'string' }
                }
            }
        })
        async get(request: Request, response: Response): Promise<Response> {
            response.body = { query: request.queryParameters };
            return response;
        }
    }
    ```

#### `requiredPath`

???+ warning
    This is required if you are using dynamic routing (ex. `{id}.ts`) with path parameters. The router will provide path values in `request.pathParameters`

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        put: {
            requiredPath: 'grower/{id}'
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ 
            path: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' }
                }
            }
        })
        async put(request: Request, response: Response): Promise<Response> {
            const { id } = request.pathParameters;
            response.body = { message: `Updated grower ${id}` };
            return response;
        }
    }
    ```

#### `requiredBody`

???+ info
    This is referencing a `components.schemas` section of your openapi.yml file defined in the `schemaPath` value in your router config.

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            requiredBody: 'post-grower-request'
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ requiredBody: 'post-grower-request' })
        async post(request: Request, response: Response): Promise<Response> {
            // Body is validated against OpenAPI schema
            const grower = request.body;
            response.body = { message: 'Grower created', grower };
            return response;
        }
    }
    ```


#### `requiredResponse`

???+ info
    This is referencing a `components.schemas` section of your openapi.yml file defined in the `schemaPath` value in your router config.

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            requiredResponse: 'post-grower-response'
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ 
            requiredBody: 'post-grower-request',
            response: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' }
                }
            }
        })
        async post(request: Request, response: Response): Promise<Response> {
            // Response will be validated against schema
            response.body = { id: '123', name: 'John Doe' };
            return response;
        }
    }
    ```


#### `requiredAuth`

???+ info
    This will trigger the function you provided in the router config under the `withAuth` configuration

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            auth: true
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Auth, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Auth()
        async post(request: Request, response: Response): Promise<Response> {
            // Authentication is handled by router's withAuth middleware
            response.body = { message: 'Authenticated request' };
            return response;
        }
    }
    ```

#### `before`

=== "Functional Pattern"

    ```typescript
    import { Request, Response } from 'acai-ts';
    import * as db from './logic/database';

    const checkGrowerExists = async (request: Request, response: Response): Promise<void> => {
        const result = await db.checkGrowerIdExists(request.pathParameters.id);
        if (!result) {
            response.code = 404;
            response.setError('grower', `grower with id: ${request.pathParameters.id} does not exist.`);
        }
    };

    export const requirements = {
        patch: {
            before: [checkGrowerExists]
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Before, Request, Response } from 'acai-ts';
    import * as db from './logic/database';

    const checkGrowerExists = async (request: Request, response: Response): Promise<void> => {
        const result = await db.checkGrowerIdExists(request.pathParameters.id);
        if (!result) {
            response.code = 404;
            response.setError('grower', `grower with id: ${request.pathParameters.id} does not exist.`);
        }
    };

    export class MyEndpoint extends BaseEndpoint {
        @Before(checkGrowerExists)
        async patch(request: Request, response: Response): Promise<Response> {
            // Pre-validation middleware runs first
            response.body = { message: 'Grower exists and updated' };
            return response;
        }
    }
    ```

#### `after`

=== "Functional Pattern"

    ```typescript
    import { Request, Response } from 'acai-ts';
    import * as db from './logic/database';

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
        get: {
            after: [filterByRelations]
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, After, Request, Response } from 'acai-ts';
    import * as db from './logic/database';

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

    export class MyEndpoint extends BaseEndpoint {
        @After(filterByRelations)
        async get(request: Request, response: Response): Promise<Response> {
            response.body = [{ id: '1', name: 'Grower 1' }, { id: '2', name: 'Grower 2' }];
            // Post-processing middleware will filter results
            return response;
        }
    }
    ```

#### `dataClass`

???+ info
    Instead of getting a `request` and `response` as arguments passed to your API function, you will get an instance of the class you provided here (functional pattern only)

=== "Functional Pattern"

    ```typescript
    import { Grower } from './logic/grower';

    export const requirements = {
        post: {
            dataClass: Grower
        }
    };

    // Handler receives Grower instance instead of request
    export const post = async (grower: Grower, response: Response): Promise<Response> => {
        response.body = { message: 'Received grower instance', grower };
        return response;
    };
    ```

=== "Decorator Pattern"

    ```typescript
    // Note: dataClass is not supported with decorator pattern
    // Instead, use validation and manual class instantiation
    import { BaseEndpoint, Validate, Request, Response } from 'acai-ts';
    import { Grower } from './logic/grower';

    export class MyEndpoint extends BaseEndpoint {
        @Validate({ requiredBody: 'GrowerSchema' })
        async post(request: Request, response: Response): Promise<Response> {
            const grower = new Grower(request.body);
            response.body = { message: 'Grower created', grower };
            return response;
        }
    }
    ```

#### `timeout`

???+ info
    This value will OVERRIDE any value set in the global timeout settings, set in the router config

=== "Functional Pattern"

    ```typescript
    export const requirements = {
        post: {
            timeout: 20000 // overrides other timeouts set in router config
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Timeout, Request, Response } from 'acai-ts';

    export class MyEndpoint extends BaseEndpoint {
        @Timeout(20000) // 20 seconds - overrides router config
        async post(request: Request, response: Response): Promise<Response> {
            // Long-running operation with custom timeout
            await someLongRunningOperation();
            response.body = { message: 'Long operation completed' };
            return response;
        }
    }
    ```

#### custom requirements (example)

???+ info
    You can add as many custom requirements as you want, with any variable type you want, and they will be passed to your `beforeAll`, `before`, `afterAll`, `after` and `withAuth` middleware defined functions.

=== "Functional Pattern"

    ```typescript
    interface CustomPermission {
        permission: string;
    }

    export const requirements = {
        post: {
            myCustomBeforeAllPermission: { permission: 'allow-delete-grower' } as CustomPermission
        }
    };
    ```

=== "Decorator Pattern"

    ```typescript
    import { BaseEndpoint, Before, Request, Response } from 'acai-ts';

    interface CustomPermission {
        permission: string;
    }

    const checkCustomPermission = async (request: Request, response: Response): Promise<void> => {
        const permission = 'allow-delete-grower'; // Custom logic here
        if (!hasPermission(request, permission)) {
            response.code = 403;
            response.setError('permission', 'Insufficient permissions');
        }
    };

    export class MyEndpoint extends BaseEndpoint {
        @Before(checkCustomPermission)
        async post(request: Request, response: Response): Promise<Response> {
            // Custom permission validation handled by middleware
            response.body = { message: 'Custom permission validated' };
            return response;
        }
    }
    ```
