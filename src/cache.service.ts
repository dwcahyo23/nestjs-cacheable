// cache.service.ts
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { CacheableMemory } from 'cacheable';
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { CacheOptions } from './types/cache.types';

@Injectable()
export class CacheService implements OnModuleDestroy {
	private readonly logger = new Logger(CacheService.name);
	private readonly memoryCache: CacheableMemory;
	private readonly redisClient?: Keyv<any>;
	private readonly tagMap = new Map<string, Set<string>>();
	private readonly defaultTTL: number;

	constructor(private readonly options?: CacheOptions) {
		const opts: CacheOptions = options ?? {};
		this.defaultTTL = opts.defaultTTL ?? 300000; // default 5 menit
		this.memoryCache = new CacheableMemory({ ttl: this.defaultTTL });

		if (opts.redisUrl) {
			try {
				const store = new KeyvRedis(opts.redisUrl);
				this.redisClient = new Keyv({ store, namespace: opts.namespace ?? 'nestjs-cacheable' });
				this.redisClient.on('error', (err: any) => {
					this.logger.warn('Keyv Redis adapter error: ' + (err?.message || err));
				});
				this.logger.log(`Redis cache connected at ${opts.redisUrl}`);
			} catch (err) {
				this.logger.warn('Failed to init KeyvRedis: ' + ((err as any)?.message || err));
			}
		} else {
			this.logger.log('Redis URL not provided, using memory-only cache');
		}
	}

	async get<T>(key: string): Promise<T | null> {
		const mem = await this.memoryCache.get(key);
		if (mem !== undefined && mem !== null) return mem as T;

		if (this.redisClient) {
			try {
				const val = await this.redisClient.get(key);
				if (val !== undefined && val !== null) {
					await this.memoryCache.set(key, val, this.defaultTTL);
					this.logger.debug(`Cache hit in Redis for key ${key}`);
					return val as T;
				}
			} catch (err) {
				this.logger.warn('Redis get failed, fallback to memory: ' + ((err as any)?.message || err));
			}
		}
		return null;
	}

	async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
		const useTtl = ttl ?? this.defaultTTL;

		try {
			await this.memoryCache.set(key, value, useTtl);
			this.logger.debug(`Cache set in memory for key ${key}`);
		} catch (err) {
			this.logger.warn('Memory set failed: ' + ((err as any)?.message || err));
		}

		if (this.redisClient) {
			try {
				await this.redisClient.set(key, value, useTtl);
				this.logger.debug(`Cache set in Redis for key ${key}`);
			} catch (err) {
				this.logger.warn('Redis set failed, value saved only to memory: ' + ((err as any)?.message || err));
			}
		}

		if (tags?.length) {
			for (const tag of tags) {
				if (!this.tagMap.has(tag)) this.tagMap.set(tag, new Set());
				this.tagMap.get(tag)!.add(key);
			}
		}
	}

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
		this.logger.debug(`Cache deleted for key ${key}`);
	}

	async invalidateTags(tags: string[]): Promise<void> {
		for (const tag of tags) {
			const keys = this.tagMap.get(tag);
			if (!keys) continue;
			for (const key of Array.from(keys)) {
				await this.del(key);
			}
			this.tagMap.delete(tag);
			this.logger.debug(`Cache invalidated for tag ${tag}`);
		}
	}

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
		this.logger.log('All cache cleared');
	}

	async onModuleDestroy() {
		await this.clear();
	}
}
