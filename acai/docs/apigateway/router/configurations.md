---
title: Configurations
description: The different options available to configure the router
---

# Router Configurations

As mentioned previously, the router is highly configurable to each project needs and desires. The point of the router is to enforce predictable thus making the API more extensible. Below is a table of all the configuration options available:

???+ example
    Don't like reading documentation? Then look at [our examples](https://github.com/syngenta/acai-ts-docs/blob/main/examples/apigateway) which can run locally!

### Configuration Options

| option                 | type     | required                             | description                                                                       |
|------------------------|----------|--------------------------------------|-----------------------------------------------------------------------------------|
| **`afterAll`**         | function | no                                   | will call this function after EVERY request to the API                            |
| **`autoValidate`**     | boolean  | no; requires `schemaPath`            | will automatically validate request against openapi.yml                           |
| **`basePath`**         | string   | yes                                  | the base path of the API Gateway instance this is running on                      |
| **`beforeAll`**        | function | no                                   | will call this function before EVERY request to the API                           |
| **`cacheSize`**        | number   | no (default: 128)                    | caches the routes and modules (not responses) for faster subsequent requests      |
| **`cacheMode`**        | enum     | no; all (default), static, dynamic   | determines which routes to cache; all, routes with dynamic paths or static only   |
| **`globalLogger`**     | boolean  | no                                   | will assign the Acai logger to the global variable `globalLogger`                 |
| **`handlerPath`**      | string   | yes, if `routingMode` == 'directory' | file path pointing to the directory where the endpoints are                       |
| **`handlerPattern`**   | string   | yes, if `routingMode` == 'pattern'   | glob pattern to be able to find the endpoint files                                |
| **`handlerList`**      | object   | yes, if `routingMode` == 'list'      | object key, value pair to be able to map routes to files                          |
| **`loggerCallback`**   | function | no                                   | will call this function on every call to `global.logger`                          |
| **`onError`**          | function | no                                   | will call this function on every unhandled error; not including validation errors |
| **`outputError`**      | boolean  | no, (default: false)                 | determines if internal service error messages are outputed by api or just default |
| **`routingMode`**      | enum     | yes; directory or pattern or list    | determines how to route requests to the right files; 3 modes                      |
| **`schemaPath`**       | string   | yes, if `autoValidate`               | file path pointing to the location of the openapi.yml file                        |
| **`withAuth`**         | function | no                                   | will call this function when `requirements` have `requiredAuth` set to `true`     |
| **`validateResponse`** | boolean  | no                                   | will validate the response from the api against openapi file or passed in schema  |
| **`timeout`**          | number   | no                                   | set timeout for all endpoints in your app separate from lambda configurations     |
| **`onTimeout`**        | function | no                                   | will call when exceeding timeout setting; have more control on what to do next    |


### Example: Router Config with Directory Routing

```typescript
import { Router, RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { MiddlewareUtils } from 'api/logic/utils/middleware';
import { Authenticator } from 'api/logic/authenticator';

const router = new Router({
    basePath: 'api',
    routingMode: 'directory',
    handlerPath: 'api/handler',
    schemaPath: 'api/openapi.yml',
    autoValidate: true,
    globalLogger: true,
    cacheSize: 512,
    cacheMode: 'all',
    timeout: 2800, // in microseconds,
    onTimeout: MiddlewareUtils.onTimeout,
    validateResponse: process.env.STAGE !== 'prod', // useful for lower environments
    outputError: process.env.STAGE !== 'prod', // useful for lower environments
    beforeAll: MiddlewareUtils.beforeAll,
    afterAll: MiddlewareUtils.afterAll,
    onError: MiddlewareUtils.onError,
    withAuth: Authenticator.authenticate,
    loggerCallback: MiddlewareUtils.loggerCallback,
});
router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

export const route = async (event: APIGatewayProxyEventV2) => {
    return router.route(event);
};
```

### Example: Router Config with Pattern Routing

```typescript
import { Router, RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { MiddlewareUtils } from 'api/logic/utils/middleware';
import { Authenticator } from 'api/logic/authenticator';

const router = new Router({
    basePath: 'api',
    routingMode: 'pattern',
    handlerPattern: 'api/**/*.controller.ts',
    schemaPath: 'api/openapi.yml',
    autoValidate: true,
    globalLogger: true,
    cacheSize: 512,
    cacheMode: 'all',
    timeout: 2800, // in microseconds,
    onTimeout: MiddlewareUtils.onTimeout,
    validateResponse: process.env.STAGE !== 'prod', // useful for lower environments
    outputError: process.env.STAGE !== 'prod', // useful for lower environments
    beforeAll: MiddlewareUtils.beforeAll,
    afterAll: MiddlewareUtils.afterAll,
    onError: MiddlewareUtils.onError,
    withAuth: Authenticator.authenticate,
    loggerCallback: MiddlewareUtils.loggerCallback,
});
router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

export const route = async (event: APIGatewayProxyEventV2) => {
    return router.route(event);
};
```

### Example: Router Config with List Routing

```typescript
import { Router, RequestClient, ResponseClient } from '@syngenta-digital/acai-ts';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { MiddlewareUtils } from 'api/logic/utils/middleware';
import { Authenticator } from 'api/logic/authenticator';

// best to put this is in separate file; but the sake of brevity...
interface RouteMap {
    [key: string]: string;
}

const routes: RouteMap = {
    'GET::grower': 'api/routes/grower.ts',
    'POST::farm': 'api/routes/farm.ts',
    'PUT:farm/{farmId}/field/{fieldId}': 'api/routes/farm-field.ts'
}

const router = new Router({
    basePath: 'api',
    routingMode: 'list',
    handlerList: routes,
    schemaPath: 'api/openapi.yml',
    autoValidate: true,
    globalLogger: true,
    cacheSize: 512,
    cacheMode: 'all',
    timeout: 2800, // in microseconds,
    onTimeout: MiddlewareUtils.onTimeout,
    validateResponse: process.env.STAGE !== 'prod', // useful for lower environments
    outputError: process.env.STAGE !== 'prod', // useful for lower environments
    beforeAll: MiddlewareUtils.beforeAll,
    afterAll: MiddlewareUtils.afterAll,
    onError: MiddlewareUtils.onError,
    withAuth: Authenticator.authenticate,
    loggerCallback: MiddlewareUtils.loggerCallback
});

router.autoLoad() // optional; pulls in files from disc into memory and shares on with concurrent lambdas

export const route = async (event: APIGatewayProxyEventV2) => {
    return router.route(event);
};
```
