import { DynamicModule } from '@nestjs/common';
import { CacheOptions } from './types/cache.types';
export declare class CacheModule {
    static register(options?: CacheOptions): DynamicModule;
}
