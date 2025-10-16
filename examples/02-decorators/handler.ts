/**
 * Example 2: Decorators
 *
 * This example demonstrates:
 * - Using @Route decorator for route definitions
 * - @Validate decorator for request validation
 * - @Auth decorator for authentication
 * - @Timeout decorator for request timeouts
 * - @Before and @After decorators for middleware
 */

import 'reflect-metadata';
import {
  Router,
  Request,
  Response,
  Route,
  Validate,
  Auth,
  Timeout,
  Before,
  After,
  Logger
} from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Set up logger
const logger = new Logger({ minLevel: 'info' });
Logger.setUpGlobal();

/**
 * Example: User Controller with decorators
 */
export class UserController {
  /**
   * GET /users - List all users
   */
  @Route('GET', '/users')
  @Timeout(5000)
  @Before(async (request: Request) => {
    logger.info('Before middleware: logging request');
    logger.debug({ path: request.path, method: request.method });
  })
  @After(async (request: Request, response: Response) => {
    logger.info('After middleware: adding custom header');
    response.setHeader('X-Custom-Header', 'acai-ts');
  })
  async listUsers(request: Request, response: Response): Promise<void> {
    const users = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ];

    response.setBody({ users, count: users.length });
  }

  /**
   * GET /users/:id - Get user by ID
   */
  @Route('GET', '/users/:id')
  @Timeout(3000)
  async getUser(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id);

    const user = {
      id: userId,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'admin'
    };

    response.setBody(user);
  }

  /**
   * POST /users - Create new user with validation
   */
  @Route('POST', '/users')
  @Validate({
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 100
        },
        email: {
          type: 'string',
          format: 'email'
        },
        age: {
          type: 'integer',
          minimum: 0,
          maximum: 150
        }
      }
    }
  })
  @Timeout(10000)
  async createUser(request: Request, response: Response): Promise<void> {
    const { name, email, age } = request.body;

    const newUser = {
      id: Math.floor(Math.random() * 1000),
      name,
      email,
      age,
      createdAt: new Date().toISOString()
    };

    logger.info(`User created: ${newUser.id}`);

    response.setStatus(201);
    response.setBody(newUser);
  }

  /**
   * PUT /users/:id - Update user (requires authentication)
   */
  @Route('PUT', '/users/:id')
  @Auth(async (request: Request): Promise<boolean> => {
    // Simple bearer token authentication
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader) {
      logger.warn('Missing authorization header');
      return false;
    }

    const token = authHeader.replace('Bearer ', '');

    // In real app, validate token against database/JWT
    if (token === 'valid-token-123') {
      logger.info('Authentication successful');
      return true;
    }

    logger.warn('Invalid authentication token');
    return false;
  })
  @Validate({
    body: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 }
      }
    }
  })
  @Timeout(5000)
  async updateUser(request: Request, response: Response): Promise<void> {
    const userId = parseInt(request.params.id);
    const updates = request.body;

    const updatedUser = {
      id: userId,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    response.setBody(updatedUser);
  }

  /**
   * DELETE /users/:id - Delete user (requires authentication)
   */
  @Route('DELETE', '/users/:id')
  @Auth(async (request: Request): Promise<boolean> => {
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];
    const token = authHeader?.replace('Bearer ', '');
    return token === 'valid-token-123';
  })
  @Timeout(3000)
  async deleteUser(request: Request, response: Response): Promise<void> {
    const userId = request.params.id;

    logger.info(`Deleting user: ${userId}`);

    response.setStatus(204);
    response.setBody({});
  }
}

/**
 * Lambda handler
 */
const router = new Router({
  mode: 'list',
  routes: [], // Routes are defined via decorators
  timeout: 30000,
  outputError: true
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing request with decorators');

  try {
    return await router.route(event);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : error });

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Example: Testing locally
 */
if (require.main === module) {
  const testEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/users',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice',
      email: 'alice@example.com',
      age: 30
    }),
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null
  };

  handler(testEvent)
    .then(result => {
      console.log('Success:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
