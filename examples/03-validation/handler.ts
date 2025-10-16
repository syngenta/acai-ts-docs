/**
 * Example 3: Validation
 *
 * This example demonstrates:
 * - Loading OpenAPI schemas (YAML/JSON)
 * - Automatic request validation
 * - Response validation
 * - Custom validation requirements
 * - Error handling
 */

import { Router, Request, Response, Logger } from 'acai-ts';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Set up logger
const logger = new Logger({ minLevel: 'info' });
Logger.setUpGlobal();

/**
 * Router with automatic validation enabled
 */
const router = new Router({
  mode: 'pattern',
  routesPath: './routes',
  schemaPath: './openapi.yaml', // Path to OpenAPI schema
  autoValidate: true, // Enable automatic validation
  validateResponse: true, // Also validate responses
  timeout: 30000,
  outputError: true
});

/**
 * Example route with validation
 * POST /products - Create a new product
 */
export const createProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  logger.info('Creating new product');

  // Request body is already validated against OpenAPI schema
  const { name, description, price, category } = request.body;

  // Simulate product creation
  const newProduct = {
    id: `prod_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    price,
    category,
    inStock: true,
    createdAt: new Date().toISOString()
  };

  logger.info(`Product created: ${newProduct.id}`);

  // Response will be validated against schema
  response.setStatus(201);
  response.setBody(newProduct);
};

/**
 * Example route with query parameter validation
 * GET /products - List products with filtering
 */
export const listProducts = async (
  request: Request,
  response: Response
): Promise<void> => {
  logger.info('Listing products');

  // Query parameters are validated
  const { category, minPrice, maxPrice, limit = 10 } = request.query;

  // Simulate filtering
  const products = [
    {
      id: 'prod_1',
      name: 'Laptop',
      price: 999.99,
      category: 'electronics',
      inStock: true
    },
    {
      id: 'prod_2',
      name: 'Coffee Mug',
      price: 12.99,
      category: 'home',
      inStock: true
    }
  ].filter(p => {
    if (category && p.category !== category) return false;
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    return true;
  }).slice(0, parseInt(limit as string));

  response.setBody({
    products,
    count: products.length,
    total: 2
  });
};

/**
 * Example route with path parameter validation
 * GET /products/:id - Get product by ID
 */
export const getProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  const productId = request.params.id;
  logger.info(`Fetching product: ${productId}`);

  // Path parameters are validated (format, pattern, etc.)
  const product = {
    id: productId,
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    category: 'electronics',
    inStock: true,
    specifications: {
      cpu: 'Intel i7',
      ram: '16GB',
      storage: '512GB SSD'
    },
    createdAt: '2025-01-01T00:00:00Z'
  };

  response.setBody(product);
};

/**
 * Example route with header validation
 * PUT /products/:id - Update product (requires API key)
 */
export const updateProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  const productId = request.params.id;
  logger.info(`Updating product: ${productId}`);

  // Headers are validated (required headers, patterns, etc.)
  const apiKey = request.headers['x-api-key'];
  logger.debug(`API Key: ${apiKey}`);

  const updates = request.body;

  const updatedProduct = {
    id: productId,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  response.setBody(updatedProduct);
};

/**
 * Lambda handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info('Processing validated request');

  try {
    return await router.route(event);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : error });

    // Validation errors are automatically handled by acai-ts
    // They return 400 Bad Request with detailed error information

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
 * Example OpenAPI Schema (save as openapi.yaml)
 */
const exampleSchema = `
openapi: 3.0.0
info:
  title: Product API
  version: 1.0.0

paths:
  /products:
    get:
      summary: List products
      parameters:
        - name: category
          in: query
          schema:
            type: string
            enum: [electronics, home, clothing, books]
        - name: minPrice
          in: query
          schema:
            type: number
            minimum: 0
        - name: maxPrice
          in: query
          schema:
            type: number
            minimum: 0
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                required: [products, count, total]
                properties:
                  products:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  count:
                    type: integer
                  total:
                    type: integer

    post:
      summary: Create product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, price, category]
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 200
                description:
                  type: string
                  maxLength: 1000
                price:
                  type: number
                  minimum: 0.01
                  exclusiveMinimum: false
                category:
                  type: string
                  enum: [electronics, home, clothing, books]
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'

  /products/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          pattern: '^prod_[a-z0-9]{9}$'

    get:
      summary: Get product by ID
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'

    put:
      summary: Update product
      parameters:
        - name: x-api-key
          in: header
          required: true
          schema:
            type: string
            pattern: '^[a-zA-Z0-9]{32}$'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
                price:
                  type: number
                  minimum: 0.01
                inStock:
                  type: boolean
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Product'

components:
  schemas:
    Product:
      type: object
      required: [id, name, price, category, inStock]
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        price:
          type: number
          minimum: 0
        category:
          type: string
        inStock:
          type: boolean
        specifications:
          type: object
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
`;

/**
 * Example: Testing locally
 */
if (require.main === module) {
  const testEvent: APIGatewayProxyEvent = {
    httpMethod: 'POST',
    path: '/products',
    pathParameters: null,
    queryStringParameters: null,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse',
      price: 29.99,
      category: 'electronics'
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

  console.log('\n--- Example OpenAPI Schema ---');
  console.log(exampleSchema);
}
