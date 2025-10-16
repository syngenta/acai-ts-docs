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

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post: {
        requiredHeaders: ['x-onbehalf-of']
    }
};
```

#### `availableHeaders`

???+ warning
    This is not recommended for frequent use as it raises errors for every header which does not conform to the array provided. Many browsers, http tools, and libraries will automatically add headers to request, unbeknownst to the user. By using this setting, you will force every user of the endpoint to take extra care with the headers provided and may result in poor API consumer experience.

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post: {
        availableHeaders: ['x-onbehalf-of']
    }
};
```

#### `requiredQuery`

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    get: {
        requiredQuery: ['requester_id']
    }
};
```

#### `availableQuery`

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    get: {
        availableQuery: ['grower_email', 'grower_phone', 'grower_first', 'grower_last'],
    }
};
```

#### `requiredPath`

???+ warning
    This is required if you are using dynamic routing (ex. `{id}.ts`) with path parameters. The router will provide a path values in `request.pathParams`

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    put: {
        requiredPath: 'grower/{id}'
    }
};
```

#### `requiredBody`

???+ info
    This is referencing a `components.schemas` section of your openapi.yml file defined in the `schemaFile` value in your router config.

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post: {
        requiredBody: 'post-grower-request'
    }
};
```


#### `requiredResponse`

???+ info
    This is referencing a `components.schemas` section of your openapi.yml file defined in the `schemaFile` value in your router config.

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post: {
        requiredResponse: 'post-grower-response'
    }
};
```


#### `requiredAuth`

???+ info
    This will trigger the function you provided in the router config under the `withAuth` configuration

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post:{
        requiredAuth: true
    }
};
```

#### `before`

```typescript
import { EndpointRequirements, RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';
import * as db from 'api/logic/database';

export const requirements: EndpointRequirements = {
    patch: {
        before: async (request: RequestClient, response: ResponseClient, requirements: any): Promise<void> => {
            const result = await db.checkGrowerIdExists(request.pathParams.id);
            if (!result){
                response.setError('grower/{id}', `grower with id: ${request.pathParams.id} does not exist.`);
            }
        }
    }
};
```

#### `after`

```typescript
import { EndpointRequirements, RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';
import * as db from 'api/logic/database';

export const requirements: EndpointRequirements = {
    get: {
        after: async (request: RequestClient, response: ResponseClient, requirements: any): Promise<ResponseClient> => {
            const relations = await db.getRequesterRelations(request.headers['x-requester-id']);
            const results: any[] = []
            for (const grower of response.rawBody){
                if (relations.includes(grower.id)){
                    results.push(grower);
                }
            }
            response.body = results;
            return response;
        }
    }
};
```

#### `dataClass`

???+ info
    Instead of getting a `request` and `response` as arguments passed to your API function, you will get an instance of the class you provided here

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';
import { Grower } from 'api/logic/grower';

export const requirements: EndpointRequirements = {
    post: {
        dataClass: Grower
    }
};
```

#### `timeout`

???+ info
    This value will OVERRIDE any value set in the global timeout settings, set in the router config

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

export const requirements: EndpointRequirements = {
    post: {
        timeout: 20000 // overrides other timeouts set in router config
    }
};
```

#### custom requirements (example)

???+ info
    You can add as many custom requirements as you want, with any variable type you want, and they will be passed to your `beforeAll`, `before`, `afterAll`, `after` and `withAuth` middleware defined functions.

```typescript
import { EndpointRequirements } from '@syngenta-digital/acai-ts';

interface CustomPermission {
    permission: string;
}

export const requirements: EndpointRequirements = {
    post:{
        myCustomBeforeAllPermission: {permission: 'allow-delete-grower'} as CustomPermission
    }
};
```
