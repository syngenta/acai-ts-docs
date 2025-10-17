---
title: Install
description: Install Acai-TS
---

# 📦 Installation

## ⚡ Requirements

* Node.js 18.18.2 or higher; [download and install Node.js](https://nodejs.org/en/download/)
* TypeScript 5.0 or higher
* Access to public [npm registry](https://www.npmjs.com/)


## 🚀 Installation
=== "npm"
```bash
npm install acai-ts
```

=== "yarn"
```bash
yarn add acai-ts
```

=== "pnpm"
```bash
pnpm add acai-ts
```

> **Note**: `reflect-metadata` is automatically installed as a dependency of `acai-ts`.

## 🔧 TypeScript Configuration

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

## 📋 Import Reflect Metadata

You must import `reflect-metadata` at the entry point of your application when using decorators:

```typescript
import 'reflect-metadata';
import { Router, BaseEndpoint } from 'acai-ts';

// Your code here...
```

> **Important**: While `reflect-metadata` is automatically installed with `acai-ts`, you still need to explicitly import it in your code for decorator support to work.

## ✅ Verify Installation

Create a simple test file to verify the installation:

```typescript
import 'reflect-metadata';
import { Router } from 'acai-ts';

const router = new Router({
  basePath: '/api/v1'
});

console.log('Acai-TS installed successfully!');
```
