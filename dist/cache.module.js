"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CacheModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheModule = void 0;
const common_1 = require("@nestjs/common");
const cache_service_1 = require("./cache.service");
const cache_interceptor_1 = require("./cache.interceptor");
const core_1 = require("@nestjs/core");
let CacheModule = CacheModule_1 = class CacheModule {
    static register(options) {
        var _a;
        this.logger.log('Registering CacheModule...');
        const cacheOptionsProvider = {
            provide: 'CACHE_OPTIONS',
            useValue: options !== null && options !== void 0 ? options : {},
        };
        const cacheServiceProvider = {
            provide: cache_service_1.CacheService,
            useFactory: (opts) => new cache_service_1.CacheService(opts),
            inject: ['CACHE_OPTIONS'],
        };
        const interceptorProvider = {
            provide: core_1.APP_INTERCEPTOR,
            useClass: cache_interceptor_1.CacheInterceptor,
        };
        this.logger.log(`CacheModule registered with options: ${JSON.stringify(options !== null && options !== void 0 ? options : {})}`);
        return {
            module: CacheModule_1,
            global: (_a = options === null || options === void 0 ? void 0 : options.isGlobal) !== null && _a !== void 0 ? _a : false,
            providers: [cacheOptionsProvider, cacheServiceProvider, core_1.Reflector, interceptorProvider],
            exports: [cache_service_1.CacheService],
        };
    }
};
exports.CacheModule = CacheModule;
CacheModule.logger = new common_1.Logger(CacheModule_1.name);
exports.CacheModule = CacheModule = CacheModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], CacheModule);
//# sourceMappingURL=cache.module.js.map