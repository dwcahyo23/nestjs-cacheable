import { DynamicModule } from '@nestjs/common';
import { CacheOptions } from './types/cache.types';
export interface CacheModuleOptions extends CacheOptions {
    isGlobal?: boolean;
}
export declare class CacheModule {
    private static readonly logger;
    static register(options?: CacheModuleOptions): DynamicModule;
}
