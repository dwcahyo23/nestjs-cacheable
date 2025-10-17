import { CacheService } from '../src/cache.service';

describe('CacheService', () => {
	let cacheService: CacheService;

	beforeEach(() => {
		// Tanpa Redis agar tidak ada koneksi eksternal saat test
		cacheService = new CacheService({ defaultTTL: 1000 });
	});

	afterEach(async () => {
		await cacheService.clear();
	});

	it('should set and get cache value', async () => {
		await cacheService.set('key1', { msg: 'hello' });
		const val = await cacheService.get<{ msg: string }>('key1');
		expect(val).toEqual({ msg: 'hello' });
	});

	it('should delete cache (del)', async () => {
		await cacheService.set('key2', { test: 123 });
		await cacheService.del('key2');
		const val = await cacheService.get('key2');
		expect(val).toBeNull();
	});

	it('should support delete alias', async () => {
		await cacheService.set('key3', { ok: true });
		await cacheService.delete('key3'); // alias
		const val = await cacheService.get('key3');
		expect(val).toBeNull();
	});

	it('should set cache with tags and invalidate by tag', async () => {
		await cacheService.set('user:1', { name: 'Yorki' }, undefined, ['users']);
		await cacheService.set('user:2', { name: 'Ayu' }, undefined, ['users']);
		expect(await cacheService.get('user:1')).toBeDefined();
		expect(await cacheService.get('user:2')).toBeDefined();

		await cacheService.invalidateTags(['users']);
		expect(await cacheService.get('user:1')).toBeNull();
		expect(await cacheService.get('user:2')).toBeNull();
	});

	it('should clear all cache and tags', async () => {
		await cacheService.set('x', 123);
		await cacheService.clear();
		expect(await cacheService.get('x')).toBeNull();
	});
});
