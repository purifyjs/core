import type { SignalReadable, SignalWritable } from "../signal/index"
import { createSignalReadable, createSignalWritable, isSignalReadable } from "../signal/index"
import { createSignalDerive } from "./derive"

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
	let _keyGetter: KeyGetter<T[number]>

	return {
		key(keyGetter: KeyGetter<T[number]>) {
			_keyGetter = keyGetter
			return this
		},
		as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			const keyGetter = _keyGetter

			const caches = new Map<unknown, { itemSignal: SignalReadable<T[number]>; indexSignal: SignalWritable<number>; value: R }>()

			return createSignalReadable<R[]>((set) => {
				return each.subscribe(
					(each) => {
						const remove = new Set(caches.keys())
						set(
							each.map((item, index) => {
								const key = keyGetter(item, index)
								const cache = caches.get(key)
								if (cache) {
									remove.delete(key)
									cache.indexSignal.ref = index
									return cache.value
								}

								const indexSignal = createSignalWritable(index)
								const itemSignal = createSignalDerive(() => each[indexSignal.ref], [indexSignal])
								const value = as(itemSignal, indexSignal)
								caches.set(key, { itemSignal, indexSignal, value })
								return value
							})
						)
						remove.forEach((key) => caches.delete(key))
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
