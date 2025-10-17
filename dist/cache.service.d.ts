import { OnModuleDestroy } from '@nestjs/common';
import { CacheOptions } from './types/cache.types';
export declare class CacheService implements OnModuleDestroy {
    private readonly options?;
    private readonly logger;
    private readonly memoryCache;
    private readonly redisClient?;
    private readonly tagMap;
    private readonly defaultTTL;
    constructor(options?: CacheOptions | undefined);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
    del(key: string): Promise<void>;
    invalidateTags(tags: string[]): Promise<void>;
    clear(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
