"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = __importDefault(require("@keyv/redis"));
const keyv_1 = __importDefault(require("keyv"));
const cacheable_1 = require("cacheable");
const common_1 = require("@nestjs/common");
let CacheService = CacheService_1 = class CacheService {
    constructor(options) {
        var _a, _b;
        this.options = options;
        this.logger = new common_1.Logger(CacheService_1.name);
        this.tagMap = new Map();
        const opts = options !== null && options !== void 0 ? options : {};
        this.defaultTTL = (_a = opts.defaultTTL) !== null && _a !== void 0 ? _a : 300000;
        this.memoryCache = new cacheable_1.CacheableMemory({ ttl: this.defaultTTL });
        if (opts.redisUrl) {
            try {
                const store = new redis_1.default(opts.redisUrl);
                this.redisClient = new keyv_1.default({ store, namespace: (_b = opts.namespace) !== null && _b !== void 0 ? _b : 'nestjs-cacheable' });
                this.redisClient.on('error', (err) => {
                    this.logger.warn('Keyv Redis adapter error: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
                });
                this.logger.log(`Redis cache connected at ${opts.redisUrl}`);
            }
            catch (err) {
                this.logger.warn('Failed to init KeyvRedis: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
            }
        }
        else {
            this.logger.log('Redis URL not provided, using memory-only cache');
        }
    }
    async get(key) {
        const mem = await this.memoryCache.get(key);
        if (mem !== undefined && mem !== null)
            return mem;
        if (this.redisClient) {
            try {
                const val = await this.redisClient.get(key);
                if (val !== undefined && val !== null) {
                    await this.memoryCache.set(key, val, this.defaultTTL);
                    this.logger.debug(`Cache hit in Redis for key ${key}`);
                    return val;
                }
            }
            catch (err) {
                this.logger.warn('Redis get failed, fallback to memory: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
            }
        }
        return null;
    }
    async set(key, value, ttl, tags) {
        const useTtl = ttl !== null && ttl !== void 0 ? ttl : this.defaultTTL;
        try {
            await this.memoryCache.set(key, value, useTtl);
            this.logger.debug(`Cache set in memory for key ${key}`);
        }
        catch (err) {
            this.logger.warn('Memory set failed: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        }
        if (this.redisClient) {
            try {
                await this.redisClient.set(key, value, useTtl);
                this.logger.debug(`Cache set in Redis for key ${key}`);
            }
            catch (err) {
                this.logger.warn('Redis set failed, value saved only to memory: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
            }
        }
        if (tags === null || tags === void 0 ? void 0 : tags.length) {
            for (const tag of tags) {
                if (!this.tagMap.has(tag))
                    this.tagMap.set(tag, new Set());
                this.tagMap.get(tag).add(key);
            }
        }
    }
    async del(key) {
        try {
            await this.memoryCache.delete(key);
        }
        catch (err) {
            this.logger.warn('Memory delete failed: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        }
        if (this.redisClient) {
            try {
                await this.redisClient.delete(key);
            }
            catch (err) {
                this.logger.warn('Redis delete failed: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
            }
        }
        for (const [, set] of this.tagMap)
            set.delete(key);
        this.logger.debug(`Cache deleted for key ${key}`);
    }
    async invalidateTags(tags) {
        for (const tag of tags) {
            const keys = this.tagMap.get(tag);
            if (!keys)
                continue;
            for (const key of Array.from(keys)) {
                await this.del(key);
            }
            this.tagMap.delete(tag);
            this.logger.debug(`Cache invalidated for tag ${tag}`);
        }
    }
    async clear() {
        try {
            this.memoryCache.clear();
        }
        catch (err) {
            this.logger.warn('Memory clear failed: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
        }
        if (this.redisClient) {
            try {
                await this.redisClient.clear();
            }
            catch (err) {
                this.logger.warn('Redis clear failed: ' + ((err === null || err === void 0 ? void 0 : err.message) || err));
            }
        }
        this.tagMap.clear();
        this.logger.log('All cache cleared');
    }
    async onModuleDestroy() {
        await this.clear();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], CacheService);
//# sourceMappingURL=cache.service.js.map