export type WeakCache<K extends PropertyKey, T extends object> = {
	get(key: K): T | undefined
	set(key: K, value: T): T
}
export function createWeakCache<K extends PropertyKey, T extends object>() {
	const caches = new Map<K, WeakRef<T>>()
	const finalizer = new FinalizationRegistry((key: K) => {
		console.log("finalizing", key)
		caches.delete(key)
	})

	const self: WeakCache<K, T> = {
		get(key) {
			return caches.get(key)?.deref()
		},
		set(key, value) {
			const cache = self.get(key)
			if (cache) {
				if (cache === value) return value
				finalizer.unregister(cache)
			}
			caches.set(key, new WeakRef(value))
			finalizer.register(value, key, value)
			return value
		}
	}

	return self
}
