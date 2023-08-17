import type { SignalReadable, SignalWritable } from "./index"
import { createSignalReadable, createSignalWritable, isSignalReadable } from "./index"

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
		as: each.map.bind(each),
	}
}

function eachOfSignalArray<T extends unknown[]>(each: SignalReadable<T>) {
	let _keyGetter: KeyGetter<T[number]> | null = null

	return {
		key(keyGetter: KeyGetter<T[number]>) {
			_keyGetter = keyGetter
			return this
		},
		as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			const keyGetter = _keyGetter ?? ((item) => item)

			const caches = new Map<unknown, { itemSignal: SignalWritable<T[number]>; indexSignal: SignalWritable<number>; value: R }>()

			return createSignalReadable<R[]>((set) => {
				return each.subscribe(
					(items) => {
						const toRemove = new Set(caches.keys())
						set(
							items.map((item, index) => {
								const key = keyGetter(item, index)
								const cache = caches.get(key)
								if (cache) {
									toRemove.delete(key)
									cache.indexSignal.ref = index
									cache.itemSignal.ref = item
									return cache.value
								}

								const indexSignal = createSignalWritable(index)
								const itemSignal = createSignalWritable(item)
								const value = as(itemSignal, indexSignal)
								caches.set(key, { itemSignal, indexSignal, value })
								return value
							})
						)
						toRemove.forEach((key) => caches.delete(key))
					},
					{ mode: "immediate" }
				).unsubscribe
			})
		},
	} as EachOfSignalArray<T>
}

export const createEach: {
	<T extends unknown[]>(each: T): EachOfArray<T>
	<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArray<T>
} = (each) => {
	if (isSignalReadable(each)) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
