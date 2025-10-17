export declare const CACHE_TTL_KEY = "cache_ttl";
export declare const CACHE_TAGS_KEY = "cache_tags";
export declare const CacheTTL: (ttlMs: number) => import("@nestjs/common").CustomDecorator<string>;
export declare const CacheTags: (tags: string[]) => import("@nestjs/common").CustomDecorator<string>;
