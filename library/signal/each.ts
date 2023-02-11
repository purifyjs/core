import { createDerive } from "./derive"
import { SignalReadable } from "./readable"
import { createWritable, SignalWritable } from "./writable"

type TypeOfEach<T> = T extends SignalReadable<infer U> ? U : T
export function createEach<T extends unknown[] | SignalReadable<unknown[]>, R>(
	each: T,
	as: (item: TypeOfEach<T>[number], index: T extends SignalReadable ? SignalReadable<number> : number) => R,
	...key: T extends SignalReadable<any> ? [(item: TypeOfEach<T>[number]) => string | number] : []
): T extends SignalReadable ? SignalReadable<R[]> : R[] {
	if (each instanceof SignalReadable) return (createEach_ArraySignal as any)(each, as, ...key) as any
	return (createEach_Array as any)(each, as, ...key) as any
}
function createEach_Array<T extends unknown[], R>(each: T, as: (item: T[number], index: number) => R): R[] {
	return each.map((item, index) => as(item, index))
}
function createEach_ArraySignal<T extends unknown[], R>(
	each: SignalReadable<T>,
	as: (item: T[number], index: SignalReadable<number>) => R,
	key: (item: T[number]) => string | number
): SignalReadable<R[]> {
	let caches: Record<string, { index: SignalWritable<number>; value: R }> = {}
	const derived = createDerive((s) => {
		const newCaches: typeof caches = {}
		const collection = each instanceof SignalReadable ? s(each).ref : each
		const results = collection.map((item, index) => {
			const k = key(item)

			const cache = caches[k]
			if (cache) {
				cache.index.ref = index
				newCaches[k] = cache
				return cache.value
			} else {
				const indexSignal = createWritable(index)
				const value = as(item, indexSignal)
				newCaches[k] = { index: indexSignal, value }
				return value
			}
		})
		caches = newCaches
		return results
	})

	return derived
}
