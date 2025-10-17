export interface CacheEntry<T = any> {
    key: string;
    value: T;
    ttl?: number;
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
    redisUrl?: string;
    defaultTTL?: number;
    namespace?: string;
}
