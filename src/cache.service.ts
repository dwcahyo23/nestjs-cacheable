import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { CacheableMemory } from 'cacheable';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { CacheOptions } from './types/cache.types';

/**
 * 🔥 CacheService
 *
 * Core caching service that provides:
 * - Dual-layer caching (Memory + Redis)
 * - TTL (Time-To-Live) control
 * - Tag-based cache invalidation
 * - Automatic cleanup on module destroy
 *
 * Supports Redis via Keyv and in-memory caching via CacheableMemory.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
	private readonly logger = new Logger(CacheService.name);
	private readonly memoryCache: CacheableMemory;
	private readonly redisClient?: Keyv<any>;
	private readonly tagMap = new Map<string, Set<string>>();
	private readonly defaultTTL: number;

	/**
	 * Creates a new CacheService instance.
	 *
	 * @param {CacheOptions} [options] - Cache configuration options.
	 * @param {string} [options.redisUrl] - Redis connection URL (e.g. `redis://localhost:6379`).
	 * @param {number} [options.defaultTTL=300000] - Default TTL in milliseconds (default: 5 minutes).
	 * @param {string} [options.namespace='nestjs-cacheable'] - Optional namespace for Redis keys.
	 */
	constructor(private readonly options?: CacheOptions) {
		const opts: CacheOptions = options ?? {};

		this.defaultTTL = opts.defaultTTL ?? 300000; // default 5 minutes
		this.memoryCache = new CacheableMemory({ ttl: this.defaultTTL });

		if (opts.redisUrl) {
			try {
				const store = new KeyvRedis(opts.redisUrl);
				this.redisClient = new Keyv({
					store,
					namespace: opts.namespace ?? 'nestjs-cacheable',
				});
				this.redisClient.on('error', (err: any) => {
					this.logger.warn('Keyv Redis adapter error: ' + (err?.message || err));
				});
			} catch (err) {
				this.logger.warn('Failed to init KeyvRedis: ' + ((err as any)?.message || err));
			}
		}
	}

	/**
	 * Retrieves a cached value by key.
	 * 
	 * Lookup order:
	 * 1. Memory cache
	 * 2. Redis (if available)
	 * 
	 * If found in Redis but missing in memory, it automatically warms up memory cache.
	 *
	 * @template T
	 * @param {string} key - Cache key to retrieve.
	 * @returns {Promise<T | null>} - Cached value or `null` if not found.
	 */
	async get<T>(key: string): Promise<T | null> {
		const mem = await this.memoryCache.get(key);
		if (mem !== undefined && mem !== null) return mem as T;

		if (this.redisClient) {
			try {
				const val = await this.redisClient.get(key);
				if (val !== undefined && val !== null) {
					// warm memory cache
					await this.memoryCache.set(key, val, this.defaultTTL);
					return val as T;
				}
			} catch (err) {
				this.logger.warn('Redis get failed, fallback to memory. ' + ((err as any)?.message || err));
			}
		}

		return null;
	}

	/**
	 * Stores a value in cache with optional TTL and tags.
	 * 
	 * @template T
	 * @param {string} key - Cache key.
	 * @param {T} value - Value to store.
	 * @param {number} [ttl] - Custom TTL in milliseconds (falls back to defaultTTL).
	 * @param {string[]} [tags] - Tags associated with this cache entry (for invalidation).
	 * @returns {Promise<void>}
	 */
	async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
		const useTtl = ttl ?? this.defaultTTL;

		try {
			await this.memoryCache.set(key, value, useTtl);
		} catch (err) {
			this.logger.warn('Memory set failed: ' + ((err as any)?.message || err));
		}

		if (this.redisClient) {
			try {
				await this.redisClient.set(key, value, useTtl);
			} catch (err) {
				this.logger.warn('Redis set failed, value saved only to memory. ' + ((err as any)?.message || err));
			}
		}

		if (tags?.length) {
			for (const tag of tags) {
				if (!this.tagMap.has(tag)) this.tagMap.set(tag, new Set());
				this.tagMap.get(tag)!.add(key);
			}
		}
	}

	/**
	 * Deletes a single cache entry by key.
	 *
	 * @param {string} key - Cache key to delete.
	 * @returns {Promise<void>}
	 */
	async del(key: string): Promise<void> {
		try {
			await this.memoryCache.delete(key);
		} catch (err) {
			this.logger.warn('Memory delete failed: ' + ((err as any)?.message || err));
		}

		if (this.redisClient) {
			try {
				await this.redisClient.delete(key);
			} catch (err) {
				this.logger.warn('Redis delete failed: ' + ((err as any)?.message || err));
			}
		}

		for (const [, set] of this.tagMap) set.delete(key);
	}

	/**
	 * Alias for `del(key)`.  
	 * Provided for backward compatibility.
	 */
	async delete(key: string): Promise<void> {
		return this.del(key);
	}

	/**
	 * Invalidates all cache entries associated with given tags.
	 *
	 * @param {string[]} tags - List of tags to invalidate.
	 * @returns {Promise<void>}
	 */
	async invalidateTags(tags: string[]): Promise<void> {
		for (const tag of tags) {
			const keys = this.tagMap.get(tag);
			if (!keys) continue;
			for (const key of Array.from(keys)) {
				await this.del(key);
			}
			this.tagMap.delete(tag);
		}
	}

	/**
	 * Clears **all** cache data (memory and Redis).
	 * 
	 * Useful for testing or global cache reset.
	 *
	 * @returns {Promise<void>}
	 */
	async clear(): Promise<void> {
		try {
			this.memoryCache.clear();
		} catch (err) {
			this.logger.warn('Memory clear failed: ' + ((err as any)?.message || err));
		}

		if (this.redisClient) {
			try {
				await this.redisClient.clear();
			} catch (err) {
				this.logger.warn('Redis clear failed: ' + ((err as any)?.message || err));
			}
		}

		this.tagMap.clear();
	}

	/**
	 * Lifecycle hook called when the NestJS module is destroyed.
	 * 
	 * Automatically clears all cache layers.
	 */
	async onModuleDestroy() {
		await this.clear();
	}
}
