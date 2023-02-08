export function bindClassMethods<T extends object>(obj: T): T {
	for (const key of Object.getOwnPropertyNames(obj.constructor.prototype)) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, key)
		if (descriptor?.value instanceof Function)
			Object.defineProperty(obj, key, { ...descriptor, value: descriptor.value.bind(obj) })
	}
	return obj
}
