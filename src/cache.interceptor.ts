import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { Request } from 'express';
import crypto from 'crypto';
import { Reflector } from '@nestjs/core';
import { CACHE_TTL_KEY, CACHE_TAGS_KEY } from './cache.decorator';

/**
 * 🧠 CacheInterceptor
 *
 * Global NestJS interceptor that automatically:
 * - Caches `GET` responses
 * - Restores cached responses for subsequent requests
 * - Invalidates tagged cache entries on mutations (`POST`, `PUT`, `PATCH`, `DELETE`)
 *
 * It integrates seamlessly with `@CacheTTL()` and `@CacheTags()` decorators.
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
	constructor(
		private readonly cacheService: CacheService,
		private readonly reflector: Reflector,
	) { }

	/**
	 * Intercepts incoming requests to manage caching behavior.
	 *
	 * @param {ExecutionContext} context - NestJS execution context containing request and handler info.
	 * @param {CallHandler} next - The next handler in the request pipeline.
	 * @returns {Promise<Observable<any>>} - Either returns cached data (from memory/redis) or processes the request.
	 *
	 * @example
	 * ```ts
	 * @Get('users')
	 * @CacheTTL(60000)
	 * @CacheTags(['users'])
	 * findAll() {
	 *   return this.userService.findAll();
	 * }
	 * ```
	 *
	 * **Behavior:**
	 * - For `GET`: returns cached result if exists, else caches the response.
	 * - For `POST/PUT/PATCH/DELETE`: invalidates related tags before proceeding.
	 */
	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const ctx = context.switchToHttp();
		const request = ctx.getRequest<Request>();
		const method = (request.method ?? 'GET').toUpperCase();

		// Get route-level cache metadata
		const tags = this.reflector.get<string[]>(CACHE_TAGS_KEY, context.getHandler()) ?? [];
		const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) ?? undefined; // in ms

		// 🧹 Invalidate cache for mutation routes
		if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
			if (tags.length) await this.cacheService.invalidateTags(tags);
			return next.handle();
		}

		// ⚡ Cache only GET (safe) methods
		const key = this.generateKey(request);

		// Try to fetch from cache
		const cached = await this.cacheService.get<any>(key);
		if (cached !== null) {
			return of(cached);
		}

		// Otherwise, execute request and cache result
		return next.handle().pipe(
			tap(async (data) => {
				// `ttl` undefined → CacheService uses default TTL
				await this.cacheService.set(key, data, ttl, tags);
			}),
		);
	}

	/**
	 * Generates a stable cache key for each request based on:
	 * - HTTP method
	 * - Original URL
	 * - Query parameters (sorted)
	 *
	 * This ensures identical requests map to the same cache key.
	 *
	 * @private
	 * @param {Request} req - Express request object.
	 * @returns {string} - SHA-256 hash representing unique cache key.
	 *
	 * @example
	 * ```ts
	 * // Example input:
	 * GET /users?limit=10&sort=asc
	 *
	 * // Example output:
	 * "b34a8e93f0d1ab2e8d9c5..."
	 * ```
	 */
	private generateKey(req: Request): string {
		const url = req.originalUrl ?? req.url;
		const raw = `${req.method}:${url}:${JSON.stringify(req.query ?? {})}`;
		return crypto.createHash('sha256').update(raw).digest('hex');
	}
}
