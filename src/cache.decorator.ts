import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for cache TTL (time-to-live) value.
 * Used internally by the CacheInterceptor to determine cache expiration.
 */
export const CACHE_TTL_KEY = 'cache_ttl';

/**
 * Metadata key for cache tags.
 * Used internally by the CacheInterceptor for cache invalidation by tags.
 */
export const CACHE_TAGS_KEY = 'cache_tags';

/**
 * Sets the time-to-live (TTL) for cached responses of a specific route handler.
 *
 * @param ttlMs - The cache duration in milliseconds.
 * @returns A custom decorator that stores the TTL metadata for the route.
 *
 * @example
 * ```ts
 * @Get()
 * @CacheTTL(60000) // Cache for 60 seconds
 * async getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const CacheTTL = (ttlMs: number) => SetMetadata(CACHE_TTL_KEY, ttlMs);

/**
 * Assigns one or more tags to a cached route handler.
 * Tags allow grouped invalidation — when a mutation occurs,
 * any cache entries sharing the same tag(s) can be cleared together.
 *
 * @param tags - An array of string identifiers for cache grouping.
 * @returns A custom decorator that stores the tag metadata for the route.
 *
 * @example
 * ```ts
 * @Get()
 * @CacheTags(['users', 'dashboard'])
 * async getUsers() {
 *   return this.userService.findAll();
 * }
 *
 * @Post()
 * @CacheTags(['users'])
 * async createUser() {
 *   // This will automatically invalidate all cache entries with 'users' tag
 * }
 * ```
 */
export const CacheTags = (tags: string[]) => SetMetadata(CACHE_TAGS_KEY, tags);
