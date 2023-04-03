import { createDerive } from "./derive"
import { SignalReadable } from "../signal/readable"
import { createWritable, SignalWritable } from "../signal/writable"

type KeyGetter<T> = (item: T, index: number) => unknown

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): this
	as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R): SignalReadable<R[]>
}

interface EachOfArray<T extends unknown[]> {
	as<R>(as: (item: T[number], index: number) => R): R[]
}

function eachOfArray<T extends unknown[]>(each: T): EachOfArray<T> {
	return {
		as<R>(as: (item: T[number], index: number) => R) {
			return each.map((item, index) => as(item, index))
		},
	}
}

function eachOfSignalArray<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArray<T> {
	let keyGetter: KeyGetter<T[number]> | null = null

	return {
		key(getter: KeyGetter<T[number]>) {
			delete (this as Partial<typeof this>).key
			keyGetter = getter
			return this
		},
		as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			delete (this as Partial<typeof this>).as
			if (!keyGetter) keyGetter = (item) => item
			let caches = new Map<unknown, { indexSignal: SignalWritable<number>; value: R }>()
			const derived = createDerive(() => {
				const newCaches: typeof caches = new Map()
				const collection = each.ref
				const results = collection.map((item, index) => {
					const key = keyGetter!(item, index)

					const cache = caches.get(key)
					if (cache) {
						cache.indexSignal.ref = index
						newCaches.set(key, cache)
						return cache.value
					} else {
						const indexSignal = createWritable(index)
						const eachSignal = createDerive(() => each.ref[indexSignal.ref])
						const value = as(eachSignal, indexSignal)
						newCaches.set(key, { indexSignal, value })
						return value
					}
				})
				caches = newCaches
				return results
			}, [each])

			return derived
		},
	}
}

export const createEach: {
	<T extends unknown[]>(each: T): EachOfArray<T>
	<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArray<T>
} = <T extends unknown[]>(each: T | SignalReadable<T>) => {
	if (each instanceof SignalReadable<T>) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
