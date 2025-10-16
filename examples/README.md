# acai-ts Examples

This directory contains working examples demonstrating various features of acai-ts.

## Examples Overview

### 1. Basic Router
**Path:** `01-basic-router/`

Demonstrates basic API Gateway routing with acai-ts. Shows how to:
- Set up a Router with pattern-based routing
- Create simple route handlers
- Handle requests and responses
- Use the Logger

### 2. Decorators
**Path:** `02-decorators/`

Shows how to use decorators for declarative route configuration. Includes:
- `@Route` decorator for defining routes
- `@Validate` for request validation
- `@Auth` for authentication
- `@Timeout` for request timeouts
- `@Before` and `@After` for middleware

### 3. Validation
**Path:** `03-validation/`

Demonstrates OpenAPI schema validation. Shows:
- Loading OpenAPI schemas (YAML/JSON)
- Automatic request validation
- Response validation
- Custom validation requirements
- Error handling

### 4. DynamoDB Streams
**Path:** `04-dynamodb/`

Example of processing DynamoDB Stream events. Includes:
- Parsing DynamoDB Stream records
- Type conversion from DynamoDB format
- Batch processing
- Error handling

### 5. S3 Events
**Path:** `05-s3/`

Example of handling S3 events and reading S3 objects. Shows:
- S3 event parsing
- Reading S3 objects (JSON, CSV, text)
- Processing multiple records
- Error handling

## Running Examples

Each example is self-contained and can be tested locally or deployed to AWS Lambda.

### Prerequisites

```bash
npm install acai-ts typescript @types/node @types/aws-lambda
```

### Local Testing

```bash
cd examples/01-basic-router
npx ts-node handler.ts
```

### Deploy to AWS Lambda

1. Build the TypeScript code:
```bash
tsc handler.ts
```

2. Package for Lambda:
```bash
zip -r function.zip handler.js node_modules/
```

3. Deploy using AWS CLI:
```bash
aws lambda create-function \
  --function-name my-acai-function \
  --runtime nodejs18.x \
  --handler handler.handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-role
```

## TypeScript Configuration

All examples assume the following `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "strict": true
  }
}
```

## Additional Resources

- [Main README](../README.md)
- [API Documentation](../docs/index.html)
- [Migration Guide](../MIGRATION.md)
- [Changelog](../CHANGELOG.md)
