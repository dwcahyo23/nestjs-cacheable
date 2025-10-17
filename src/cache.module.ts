// cache.module.ts
import { Module, Global, DynamicModule, Provider, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheInterceptor } from './cache.interceptor';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { CacheOptions } from './types/cache.types';

export interface CacheModuleOptions extends CacheOptions {
	isGlobal?: boolean;
}

@Global()
@Module({})
export class CacheModule {
	private static readonly logger = new Logger(CacheModule.name);

	static register(options?: CacheModuleOptions): DynamicModule {
		this.logger.log('Registering CacheModule...');

		const cacheOptionsProvider: Provider = {
			provide: 'CACHE_OPTIONS',
			useValue: options ?? {},
		};

		const cacheServiceProvider: Provider = {
			provide: CacheService,
			useFactory: (opts: CacheModuleOptions) => new CacheService(opts),
			inject: ['CACHE_OPTIONS'],
		};

		const interceptorProvider: Provider = {
			provide: APP_INTERCEPTOR,
			useClass: CacheInterceptor,
		};

		this.logger.log(
			`CacheModule registered with options: ${JSON.stringify(options ?? {})}`,
		);

		return {
			module: CacheModule,
			global: options?.isGlobal ?? false,
			providers: [cacheOptionsProvider, cacheServiceProvider, Reflector, interceptorProvider],
			exports: [CacheService],
		};
	}
}
