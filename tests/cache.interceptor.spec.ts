import { of, firstValueFrom } from 'rxjs';
import { CacheInterceptor } from '../src/cache.interceptor';
import { CacheService } from '../src/cache.service';
import { Reflector } from '@nestjs/core';

describe('CacheInterceptor', () => {
	let cacheService: CacheService;
	let reflector: Reflector;
	let interceptor: CacheInterceptor;

	beforeEach(() => {
		cacheService = new CacheService({ defaultTTL: 1000 });
		reflector = new Reflector();
		interceptor = new CacheInterceptor(cacheService, reflector);
	});

	it('should cache GET requests', async () => {
		const handlerMock = () => { }; // dummy handler agar Reflector tidak error
		const mockContext: any = {
			switchToHttp: () => ({
				getRequest: () => ({
					method: 'GET',
					originalUrl: '/test',
					query: {},
				}),
			}),
			getHandler: () => handlerMock,
		};

		// Mock reflector agar tidak error
		jest.spyOn(reflector, 'get').mockImplementation(() => undefined);

		const next = { handle: jest.fn(() => of({ msg: 'data' })) };

		const result$ = await interceptor.intercept(mockContext, next);
		const result = await firstValueFrom(result$);
		expect(result).toEqual({ msg: 'data' });

		const key = (interceptor as any).generateKey({
			method: 'GET',
			originalUrl: '/test',
			query: {},
		});
		const cached = await cacheService.get(key);
		expect(cached).toEqual({ msg: 'data' });
	});

	it('should invalidate cache tags on POST', async () => {
		const handlerMock = () => { };
		const invalidateSpy = jest.spyOn(cacheService, 'invalidateTags').mockResolvedValue();

		const mockContext: any = {
			switchToHttp: () => ({
				getRequest: () => ({
					method: 'POST',
					originalUrl: '/dashboard',
				}),
			}),
			getHandler: () => handlerMock,
		};

		jest
			.spyOn(reflector, 'get')
			.mockImplementation((metadataKey: any, target: any) => {
				if (metadataKey === 'cache_tags') return ['dashboard'];
				return undefined;
			});

		const next = { handle: jest.fn(() => of({ success: true })) };

		await firstValueFrom(await interceptor.intercept(mockContext, next));

		// beri waktu untuk promise invalidateTags resolve
		await new Promise((r) => setTimeout(r, 0));

		expect(invalidateSpy).toHaveBeenCalledWith(['dashboard']);
	});

});
