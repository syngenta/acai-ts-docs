---
title: Set Up
description: How to use the Acai Router
---

# Router Set Up

???+ example
    Don't like reading documentation? Then look at [our examples](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!


### 1. Configure the Lambda

=== "Serverless Framework"

```yaml
functions:
    apigateway-handler:
        handler: api/handler/router.route
        events:
            - http:
                path: /
                method: ANY
            - http:
                path: /{proxy+}
                method: ANY
```

### 2. Configure the Router

There are three routing modes: `directory`, `pattern` and `list`; `directory` and `pattern` routing mode requires your project files to be placed in a particular way; `list` does not require any structure, as you define every route and it's corresponding file. Below are the three ways configure your router:

#### Routing Mode: Directory

???+ tip
    If you are using route params, you will need use dynamic file names which follow this pattern: `{some-variable-name}.ts`.

=== "file structure"

    ```
    ~~ Directory ~~                     ~~ Route ~~
    ===================================================================
    =api/                              |
    ---=handler                       |
        ---=router.ts                 |
        ---=org.ts                    | /org
        ---=grower                    |
            ---=index.ts              | /grower
            ---={growerId}.ts         | /grower/{growerId}
        ---=farm                      |
            ---=index.ts              | /farm
            ---={farmId}              |
                ---=index.ts          | /farm/{farmId}
                ---=field             |
                    ---=index.ts      | /farm/{farmId}/field
                    ---={fieldId}.ts  | /farm/{farmId}/field/{fieldId}
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    const router = new Router({
        routingMode: 'directory',
        basePath: 'api', // for use with custom apigateway domain
        handlerPath: 'api/handler'
    });
    router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

    export const route = async (event: APIGatewayProxyEventV2) => {
        return router.route(event);
    };
    ```

#### Routing Mode: Pattern

???+ tip
    You can use any [glob](https://en.wikipedia.org/wiki/Glob_(programming)) pattern you like; common patterns are:

    * `/**/*.controller.ts`

    * `/**/handler.*.ts`

    * `/**/endpoint.ts`

=== "file structure"

    ```
    ~~ Pattern ~~                               ~~ Route ~~
    ================================================================================
    =api/                                      |
    ---=router.ts                             |
    ---=org                                   |
        ---=org.controller.ts                 | /org
        ---=org.model.ts                      |
        ---=org.factory.ts                    |
        ---=org.logic.ts                      |
    ---=grower                                |
        ---=grower.controller.ts              | /grower
        ---={growerId}.controller.ts          | /grower/{growerId}
        ---=grower.model.ts                   |
        ---=grower.factory.ts                 |
        ---=grower.logic.ts                   |
    ---=farm                                  |
        ---=farm.controller.ts                | /farm
        ---=farm.logic.ts                     |
        ---=farm.model.ts                     |
        ---={farmId}                          |
            ---={farmId}.controller.ts        | /farm/{farmId}
            ---=field                         |
                ---=field.controller.ts       | /farm/{farmId}/field
                ---={fieldId}.controller.ts   | /farm/{farmId}/field/{fieldId}
                ---=field.logic.ts            |
                ---=field.model.ts            |
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    export const route = async (event: APIGatewayProxyEventV2) => {
        const router = new Router({
            routingMode: 'pattern',
            basePath: 'api', // for use with custom apigateway domain
            handlerPattern: 'api/**/*.controller.ts'
        });
        return router.route(event);
    };
    ```

#### Routing Mode: List

???+ tip
    It may be more maintainable to store your routes list in a separate file, this example does not have that for brevity

???+ warning
    Even though you are matching your files to your routes, the handler files must have functions that match HTTP method (see endpoint examples here)

???+ danger
    This is not the preferred routing mode to use; this can lead to a sloppy, unpredictable project architecture which will be hard to maintain and extend. This is *NOT RECOMMENDED*.

=== "file structure"

    ```
    File structure doesn't matter
    ======================================================
    =api/
    ---=router.ts
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    const router = new Router({
        routingMode: 'list',
        basePath: 'api', // for use with custom apigateway domain
        handlerList: {
            'GET::grower': 'api/routes/grower.ts',
            'POST::farm': 'api/routes/farm.ts',
            'PUT:farm/{farmId}/field/{fieldId}': 'api/routes/farm-field.ts'
        }
    });

    router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

    export const route = async (event: APIGatewayProxyEventV2) => {
        return router.route(event);
    };
    ```


### 3. Configure the Endpoint File

Every endpoint file should contain a function which matches an [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) in lower case. Most common are `post`, `get`, `put`, `patch`, `delete`, but this library does support custom methods, if you so choose. As long as the method of the request matches the function name, it will work.

```typescript
import { RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';

export const post = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {post: true};
    return response;
};

export const get = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {get: true};
    return response;
};

export const patch = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {patch: true};
    return response;
};

export const put = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {put: true};
    return response;
};

export const deleteMethod = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {delete: true};
    return response;
};

// this is a non-compliant, custom http method; this will work.
export const query = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = [{query: true}];
    return response;
};
```

---
title: Set Up
description: How to use the Acai Router
---

# Router Set Up

???+ example
    Don't like reading documentation? Then look at [our examples](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!


### 1. Configure the Lambda

=== "Serverless Framework"

```yaml
functions:
    apigateway-handler:
        handler: api/handler/router.route
        events:
            - http:
                path: /
                method: ANY
            - http:
                path: /{proxy+}
                method: ANY
```

### 2. Configure the Router

There are three routing modes: `directory`, `pattern` and `list`; `directory` and `pattern` routing mode requires your project files to be placed in a particular way; `list` does not require any structure, as you define every route and it's corresponding file. Below are the three ways configure your router:

#### Routing Mode: Directory

???+ tip
    If you are using route params, you will need use dynamic file names which follow this pattern: `{some-variable-name}.ts`.

=== "file structure"

    ```
    ~~ Directory ~~                     ~~ Route ~~
    ===================================================================
    =api/                              |
    ---=handler                       |
        ---=router.ts                 |
        ---=org.ts                    | /org
        ---=grower                    |
            ---=index.ts              | /grower
            ---={growerId}.ts         | /grower/{growerId}
        ---=farm                      |
            ---=index.ts              | /farm
            ---={farmId}              |
                ---=index.ts          | /farm/{farmId}
                ---=field             |
                    ---=index.ts      | /farm/{farmId}/field
                    ---={fieldId}.ts  | /farm/{farmId}/field/{fieldId}
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    const router = new Router({
        mode: 'directory',
        basePath: '/api', // for use with custom apigateway domain
        routesPath: 'api/handler'
    });
    router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

    export const route = async (event: APIGatewayProxyEventV2) => {
        return router.route(event);
    };
    ```

#### Routing Mode: Pattern

???+ tip
    You can use any [glob](https://en.wikipedia.org/wiki/Glob_(programming)) pattern you like; common patterns are:

    * `/**/*.controller.ts`

    * `/**/handler.*.ts`

    * `/**/endpoint.ts`

=== "file structure"

    ```
    ~~ Pattern ~~                               ~~ Route ~~
    ================================================================================
    =api/                                      |
    ---=router.ts                             |
    ---=org                                   |
        ---=org.controller.ts                 | /org
        ---=org.model.ts                      |
        ---=org.factory.ts                    |
        ---=org.logic.ts                      |
    ---=grower                                |
        ---=grower.controller.ts              | /grower
        ---={growerId}.controller.ts          | /grower/{growerId}
        ---=grower.model.ts                   |
        ---=grower.factory.ts                 |
        ---=grower.logic.ts                   |
    ---=farm                                  |
        ---=farm.controller.ts                | /farm
        ---=farm.logic.ts                     |
        ---=farm.model.ts                     |
        ---={farmId}                          |
            ---={farmId}.controller.ts        | /farm/{farmId}
            ---=field                         |
                ---=field.controller.ts       | /farm/{farmId}/field
                ---={fieldId}.controller.ts   | /farm/{farmId}/field/{fieldId}
                ---=field.logic.ts            |
                ---=field.model.ts            |
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    export const route = async (event: APIGatewayProxyEventV2) => {
        const router = new Router({
            mode: 'pattern',
            basePath: '/api', // for use with custom apigateway domain
            routesPath: 'api/**/*.controller.ts'
        });
        return router.route(event);
    };
    ```

#### Routing Mode: List

???+ tip
    It may be more maintainable to store your routes list in a separate file, this example does not have that for brevity

???+ warning
    Even though you are matching your files to your routes, the handler files must have functions that match HTTP method (see endpoint examples here)

???+ danger
    This is not the preferred routing mode to use; this can lead to a sloppy, unpredictable project architecture which will be hard to maintain and extend. This is *NOT RECOMMENDED*.

=== "file structure"

    ```
    File structure doesn't matter
    ======================================================
    =api/
    ---=router.ts
    ```

=== "router.ts"

    ```typescript
    import { Router } from '@syngenta-digital/acai-ts';
    import { APIGatewayProxyEventV2 } from 'aws-lambda';

    const router = new Router({
        mode: 'list',
        basePath: '/api', // for use with custom apigateway domain
        routes: [
            { method: 'GET', path: '/grower', handler: 'api/routes/grower.ts' },
            { method: 'POST', path: '/farm', handler: 'api/routes/farm.ts' },
            { method: 'PUT', path: '/farm/{farmId}/field/{fieldId}', handler: 'api/routes/farm-field.ts' }
        ]
    });

    router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

    export const route = async (event: APIGatewayProxyEventV2) => {
        return router.route(event);
    };
    ```


### 3. Configure the Endpoint File

Every endpoint file should contain a function which matches an [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) in lower case. Most common are `post`, `get`, `put`, `patch`, `delete`, but this library does support custom methods, if you so choose. As long as the method of the request matches the function name, it will work.

```typescript
import { RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';

export const post = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {post: true};
    return response;
};

export const get = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {get: true};
    return response;
};

export const patch = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {patch: true};
    return response;
};

export const put = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {put: true};
    return response;
};

export const deleteMethod = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = {delete: true};
    return response;
};

// this is a non-compliant, custom http method; this will work.
export const query = async (request: RequestClient, response: ResponseClient): Promise<ResponseClient> => {
    response.body = [{query: true}];
    return response;
};
```
