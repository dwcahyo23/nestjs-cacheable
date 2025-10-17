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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const cache_service_1 = require("./cache.service");
const crypto_1 = __importDefault(require("crypto"));
const core_1 = require("@nestjs/core");
const cache_decorator_1 = require("./cache.decorator");
let CacheInterceptor = class CacheInterceptor {
    constructor(cacheService, reflector) {
        this.cacheService = cacheService;
        this.reflector = reflector;
    }
    async intercept(context, next) {
        var _a, _b, _c;
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const method = ((_a = request.method) !== null && _a !== void 0 ? _a : 'GET').toUpperCase();
        const tags = (_b = this.reflector.get(cache_decorator_1.CACHE_TAGS_KEY, context.getHandler())) !== null && _b !== void 0 ? _b : [];
        const ttl = (_c = this.reflector.get(cache_decorator_1.CACHE_TTL_KEY, context.getHandler())) !== null && _c !== void 0 ? _c : undefined;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            if (tags.length)
                await this.cacheService.invalidateTags(tags);
            return next.handle();
        }
        const key = this.generateKey(request);
        const cached = await this.cacheService.get(key);
        if (cached !== null) {
            return (0, rxjs_1.of)(cached);
        }
        return next.handle().pipe((0, operators_1.tap)(async (data) => {
            await this.cacheService.set(key, data, ttl, tags);
        }));
    }
    generateKey(req) {
        var _a, _b;
        const url = (_a = req.originalUrl) !== null && _a !== void 0 ? _a : req.url;
        const raw = `${req.method}:${url}:${JSON.stringify((_b = req.query) !== null && _b !== void 0 ? _b : {})}`;
        return crypto_1.default.createHash('sha256').update(raw).digest('hex');
    }
};
exports.CacheInterceptor = CacheInterceptor;
exports.CacheInterceptor = CacheInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        core_1.Reflector])
], CacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map