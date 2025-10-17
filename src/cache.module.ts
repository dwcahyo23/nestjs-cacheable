import { Module, Global, DynamicModule } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { CacheOptions } from './types/cache.types';

@Global()
@Module({})
export class CacheModule {
	static register(options?: CacheOptions): DynamicModule {
		return {
			module: CacheModule,
			providers: [
				{
					provide: 'CACHE_OPTIONS',
					useValue: options ?? {},
				},
				{
					provide: CacheService,
					useFactory: (opts: CacheOptions) => new CacheService(opts),
					inject: ['CACHE_OPTIONS'],
				},
				Reflector,
				{
					provide: APP_INTERCEPTOR,
					useClass: CacheInterceptor,
				},
			],
			exports: [CacheService],
		};
	}
}
