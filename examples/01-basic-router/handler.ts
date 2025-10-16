/**
 * Example 1: Basic Router
 *
 * This example demonstrates:
 * - Setting up a basic Router with pattern-based routing
 * - Creating simple route handlers
 * - Handling GET and POST requests
 * - Using the Logger
 */

import { Router, Request, Response, Logger } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Set up global logger
const logger = new Logger({ minLevel: 'info' });
Logger.setUpGlobal();

// Create router with pattern-based routing
const router = new Router({
  mode: 'pattern',
  routesPath: './routes',
  timeout: 30000,
  outputError: true
});

/**
 * Lambda handler function
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing API Gateway request');
  logger.debug({ path: event.path, method: event.httpMethod });

  try {
    // Route the request
    const result = await router.route(event);

    logger.info('Request completed successfully');
    return result;
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
 * Example route handlers (these would typically be in separate files)
 */

// GET /users - List users
export const listUsers = async (request: Request, response: Response): Promise<void> => {
  logger.info('Fetching users list');

  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];

  response.setStatus(200);
  response.setBody({ users, count: users.length });
};

// GET /users/:id - Get user by ID
export const getUser = async (request: Request, response: Response): Promise<void> => {
  const userId = request.params.id;
  logger.info(`Fetching user with ID: ${userId}`);

  // Simulate database lookup
  const user = {
    id: parseInt(userId),
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date().toISOString()
  };

  response.setStatus(200);
  response.setBody(user);
};

// POST /users - Create new user
export const createUser = async (request: Request, response: Response): Promise<void> => {
  logger.info('Creating new user');

  const { name, email } = request.body;

  // Simulate user creation
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    name,
    email,
    createdAt: new Date().toISOString()
  };

  logger.info(`User created with ID: ${newUser.id}`);

  response.setStatus(201);
  response.setBody(newUser);
};

// DELETE /users/:id - Delete user
export const deleteUser = async (request: Request, response: Response): Promise<void> => {
  const userId = request.params.id;
  logger.info(`Deleting user with ID: ${userId}`);

  // Simulate deletion
  response.setStatus(204);
  response.setBody({});
};

/**
 * Example: Testing locally
 */
if (require.main === module) {
  // Create a test event
  const testEvent: APIGatewayProxyEvent = {
    httpMethod: 'GET',
    path: '/users',
    pathParameters: null,
    queryStringParameters: null,
    headers: {},
    body: null,
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
