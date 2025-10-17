---
title: Logger
description: How to use the Acai-TS Logger
---

The Acai-TS logger automatically logs in a formatted JSON string for easy reading and searching with AWS CloudWatch. A developer can then use [AWS filter patterns](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html) making it effortless to find the exact log they are looking for. Below is an example of how to use the logger:

## 📚 Examples

### 🚀 Basic Usage

```typescript
import { Logger } from 'acai-ts';

// If you use globalLogger: true in any config, the logger is available globally
Logger.info('testing info');

Logger.debug('testing debug');

Logger.warn('testing warn');

Logger.error('testing error');

// Standard output
{
	level: '$LEVEL', 
    log: '$MESSAGE'
}
```

### 🔧 Advanced Usage

```typescript
import { Logger } from 'acai-ts';

// Custom log object with structured data
Logger.log({ level: 'INFO', log: { someKey: 'testing info' } });

// Standard output
{
    level: 'INFO',
    log: {
        someKey: 'testing info'
    }
}
```

### 🌍 Global Logger Setup

```typescript
import { Logger } from 'acai-ts';

// Set up global logger with custom callback
Logger.setUpGlobal(true, {
  callback: (level: string, ...args: any[]) => {
    // Custom logging logic (e.g., send to CloudWatch, Datadog, etc.)
    console.log(`[${level}]`, ...args);
  }
});

// Now logger is available throughout your application
Logger.info('Application started');
```

### 📝 TypeScript Types

```typescript
import { Logger } from 'acai-ts';

// Logger methods are fully typed
Logger.info('string message');                    // ✅ Valid
Logger.log({ level: 'INFO', log: 'message' });   // ✅ Valid
Logger.error('error', new Error('Something'));    // ✅ Valid

// Type-safe log levels
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const level: LogLevel = 'INFO';
Logger.log({ level, log: { data: 'value' } });
```

## ⚙️ Configuration Options

The logger can be configured when setting up your Event handlers or Router:

```typescript
import { Event } from 'acai-ts';
import { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const dynamodb = new Event(event, {
    globalLogger: true,  // Enable global logger
    operations: ['INSERT', 'MODIFY']
  });

  // Logger is now available
  Logger.info('Processing DynamoDB stream');
  
  await dynamodb.process();
};
```
