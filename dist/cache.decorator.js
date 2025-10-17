"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTags = exports.CacheTTL = exports.CACHE_TAGS_KEY = exports.CACHE_TTL_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CACHE_TTL_KEY = 'cache_ttl';
exports.CACHE_TAGS_KEY = 'cache_tags';
const CacheTTL = (ttlMs) => (0, common_1.SetMetadata)(exports.CACHE_TTL_KEY, ttlMs);
exports.CacheTTL = CacheTTL;
const CacheTags = (tags) => (0, common_1.SetMetadata)(exports.CACHE_TAGS_KEY, tags);
exports.CacheTags = CacheTags;
//# sourceMappingURL=cache.decorator.js.map