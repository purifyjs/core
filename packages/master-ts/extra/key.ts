export let keyedCache = () => {
	const map = new Map<unknown, unknown>()
	return {
		key: <T>(key: unknown, fn: () => T): T => {
			if (map.has(key)) return map.get(key) as T
			const value = fn()
			map.set(key, value)
			return value
		}
	}
}
