import { derive } from "./derive"
import { SignalReadable } from "./readable"
import { writable, SignalWritable } from "./writable"

type KeyGetter<T> = (item: T, index: number) => string | number

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): this
	as<R>(as: (item: T[number], index: SignalReadable<number>) => R): SignalReadable<R[]>
}

interface EachOfArray<T extends unknown[]> {
	as<R>(as: (item: T[number], index: number) => R): R[]
}

function isEachSignal<T extends unknown[]>(each: unknown): each is SignalReadable<T> {
	return each instanceof SignalReadable
}

export function each<U extends SignalReadable<unknown[]> | unknown[]>(
	each: U
): U extends SignalReadable<infer T> ? (T extends unknown[] ? EachOfSignalArray<T> : never) : U extends unknown[] ? EachOfArray<U> : never {
	type T = U extends SignalReadable<infer T> ? T : U

	if (isEachSignal(each)) {
		let keyGetter: KeyGetter<T[number]> = (_, index) => index
		return {
			key(getter: KeyGetter<T[number]>) {
				keyGetter = getter
				return this
			},
			as<R>(as: (item: T[number], index: SignalReadable<number>) => R) {
				let caches: Record<string, { index: SignalWritable<number>; value: R }> = {}
				const derived = derive((s) => {
					const newCaches: typeof caches = {}
					const collection = s(each).ref
					const results = collection.map((item, index) => {
						const k = keyGetter(item, index)

						const cache = caches[k]
						if (cache) {
							cache.index.ref = index
							newCaches[k] = cache
							return cache.value
						} else {
							const indexSignal = writable(index)
							const value = as(item, indexSignal)
							newCaches[k] = { index: indexSignal, value }
							return value
						}
					})
					caches = newCaches
					return results
				})

				return derived
			},
		} as any
	}

	return {
		as<R>(as: (item: T[number], index: number) => R) {
			return each.map((item, index) => as(item, index))
		},
	} as any
}
