export class WeakCache<K extends PropertyKey, T extends object> {
	#caches = new Map<K, WeakRef<T>>()
	#finalizer = new FinalizationRegistry((key: K) => {
		console.log("finalizing", key)
		this.#caches.delete(key)
	})

	constructor(iterable?: Iterable<[K, T]>) {
		if (iterable) for (const [key, value] of iterable) this.set(key, value)
	}

	get(key: K) {
		return this.#caches.get(key)?.deref()
	}
	set<V extends T>(key: K, value: V) {
		const cache = this.get(key)
		if (cache) {
			if (cache === value) return value
			this.#finalizer.unregister(cache)
		}
		this.#caches.set(key, new WeakRef(value))
		this.#finalizer.register(value, key, value)
		return value
	}
}
