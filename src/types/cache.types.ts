export interface CacheEntry<T = any> {
	key: string;
	value: T;
	ttl?: number; // milliseconds
	tags?: string[];
}

export interface CacheAdapter {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
	del(key: string): Promise<void>;
	invalidateTags(tags: string[]): Promise<void>;
	clear(): Promise<void>;
}

export interface CacheOptions {
	redisUrl?: string;      // e.g. 'redis://localhost:6379'
	defaultTTL?: number;    // milliseconds (default e.g. 300000)
	namespace?: string;     // keyv namespace
}
