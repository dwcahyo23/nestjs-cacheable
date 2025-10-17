# ⚡️ @dwcahyo/nestjs-cacheable

> A lightweight and powerful NestJS caching library built with **Keyv**, **Redis**, and **CacheableMemory**.
> It provides **automatic caching**, **tag-based invalidation**, and **TTL control** — perfect for APIs and dashboards.

---

## 🚀 Features

* 🧠 **Auto cache** for GET requests
* 🔖 **Tag-based invalidation** for POST/PUT/PATCH/DELETE
* ⏱️ **Custom TTL per route**
* 💾 **Supports Memory + Redis** (via [Keyv](https://github.com/jaredwray/keyv))
* 🧩 **Global interceptor** integration
* 🧰 Works out-of-the-box — no extra config required

---

## 📦 Installation

```bash
npm install @dwcahyo/nestjs-cacheable
# or
yarn add @dwcahyo/nestjs-cacheable
```

---

## ⚙️ Quick Setup

### 1️⃣ Import the Module

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@dwcahyo/nestjs-cacheable';

@Module({
  imports: [
    CacheModule.register({
      redisUrl: 'redis://localhost:6379', // optional
      defaultTTL: 300000, // optional (5 minutes)
      namespace: 'my-app-cache', // optional
    }),
  ],
})
export class AppModule {}
```

✅ **Explanation:**

* If `redisUrl` is not provided, it falls back to **in-memory caching**.
* `defaultTTL` defines the default cache lifetime in milliseconds.
* `namespace` helps isolate cache keys per project or module.

No need to configure anything in `main.ts` —
`CacheModule.register()` automatically sets up the cache globally.

---

## 🧩 Decorators

### 🕒 `@CacheTTL(milliseconds)`

Set a custom TTL (time-to-live) for a specific route.

```ts
import { CacheTTL } from '@dwcahyo/nestjs-cacheable';

@CacheTTL(60000) // cache for 1 minute
@Get('products')
findAll() { ... }
```

### 🏷️ `@CacheTags(tags)`

Assign tags to cached routes for group invalidation.

```ts
import { CacheTags } from '@dwcahyo/nestjs-cacheable';

@CacheTags(['products'])
@Post('products')
createProduct() { ... }
```

When you send a `POST`, `PUT`, `PATCH`, or `DELETE` to a route with matching tags,
all related caches are automatically invalidated.

---

## 🧠 Example Usage

```ts
import { Controller, Get, Post } from '@nestjs/common';
import { CacheTags, CacheTTL } from '@dwcahyo/nestjs-cacheable';

@Controller('users')
export class UserController {
  @Get()
  @CacheTTL(120000)
  @CacheTags(['users'])
  async findAll() {
    return [{ id: 1, name: 'Yorki' }];
  }

  @Post()
  @CacheTags(['users'])
  async createUser() {
    // new data triggers invalidation of 'users' cache
    return { message: 'User created' };
  }
}
```

🌀 **Behavior:**

* First `GET /users` → Cached for 2 minutes
* Next `GET /users` → Served from cache
* `POST /users` → Invalidates tag `users` → Cache refreshed

---

## 🧩 CacheService API

| Method                                       | Description                      | Parameters                    |
| -------------------------------------------- | -------------------------------- | ----------------------------- |
| `get<T>(key: string)`                        | Retrieve cached data             | `key`                         |
| `set<T>(key: string, value: T, ttl?, tags?)` | Store data in cache              | `ttl` (ms), `tags` (string[]) |
| `del(key: string)`                           | Delete specific key              | `key`                         |
| `invalidateTags(tags: string[])`             | Invalidate cache entries by tags | `tags`                        |
| `clear()`                                    | Clear all cache (memory & Redis) | —                             |

---

## 🏗️ Internal Architecture

| Layer                 | Description                                                                                                                           | Key Components                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Controller Layer**  | Handles API routes and defines cache behavior using decorators.                                                                       | `@CacheTags(['users'])`, `@CacheTTL(60000)`                 |
| **Cache Interceptor** | Intercepts requests and responses. Automatically caches `GET` requests and invalidates tags for `POST`, `PUT`, `PATCH`, and `DELETE`. | `CacheInterceptor`                                          |
| **Cache Service**     | Core caching layer that manages read/write operations, TTL, and tag-based invalidation.                                               | `CacheService`                                              |
| **Storage Layer**     | Provides actual storage for cache entries. Supports both in-memory and Redis backends.                                                | - `CacheableMemory` (local)<br> - `KeyvRedis` (distributed) |

---

### 🔄 Request Lifecycle Overview

| Step | Request Type                        | Behavior                                                          | Result                     |
| ---- | ----------------------------------- | ----------------------------------------------------------------- | -------------------------- |
| 1️⃣  | `GET /endpoint`                     | CacheInterceptor checks cache → returns cached data if available. | ⚡ Fast response (cached)   |
| 2️⃣  | `GET /endpoint` (no cache)          | Executes handler → caches response with TTL and tags.             | 🧠 New cache entry created |
| 3️⃣  | `POST /endpoint` or `PUT /endpoint` | Executes handler → invalidates all caches with matching tags.     | 🧹 Cache invalidated       |
| 4️⃣  | `DELETE /endpoint`                  | Removes related cache entries based on tags.                      | 🗑️ Cache cleared          |

---

## 🪄 Example with Redis

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@dwcahyo/nestjs-cacheable';

@Module({
  imports: [
    CacheModule.register({
      redisUrl: 'redis://localhost:6379',
      defaultTTL: 60000, // 1 minute
      namespace: 'example-app',
    }),
  ],
})
export class AppModule {}
```

The module automatically handles both Redis and memory fallback.

---

## 🧪 Testing

This package includes Jest tests for both the **CacheInterceptor** and **CacheService**.

Run tests locally:

```bash
npm test
```

All tests are isolated — no real Redis connection is required unless explicitly configured.

---

## 🧰 Tech Stack

| Library                                              | Purpose                  |
| ---------------------------------------------------- | ------------------------ |
| [NestJS](https://nestjs.com)                         | Core framework           |
| [Keyv](https://github.com/jaredwray/keyv)            | Unified cache interface  |
| [KeyvRedis](https://github.com/jaredwray/keyv-redis) | Redis adapter            |
| [cacheable](https://github.com/jaredwray/cacheable)  | In-memory cache          |
| [RxJS](https://rxjs.dev)                             | Reactive stream handling |

---

## 👨‍💻 Author

**Developed with ❤️ by [dwcahyo](https://github.com/dwcahyo23)**

> A simple, powerful, and tag-aware caching layer for any NestJS project.
