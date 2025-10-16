---
title: Install
description: Install Acai-TS
---

## Requirements

* Node.js 18.18.2 or higher; [download and install Node.js](https://nodejs.org/en/download/)
* TypeScript 5.0 or higher
* Access to public [npm registry](https://www.npmjs.com/)


## Installation
=== "npm"
```bash
npm install acai-ts reflect-metadata
```

=== "yarn"
```bash
yarn add acai-ts reflect-metadata
```

=== "pnpm"
```bash
pnpm add acai-ts reflect-metadata
```

## TypeScript Configuration

Acai-TS requires the following TypeScript compiler options in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Import Reflect Metadata

You must import `reflect-metadata` at the entry point of your application:

```typescript
import 'reflect-metadata';
import { Router, Endpoint } from 'acai-ts';

// Your code here...
```

## Verify Installation

Create a simple test file to verify the installation:

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';

const router = new Router({
  basePath: '/api/v1'
});

console.log('Acai-TS installed successfully!');
```
