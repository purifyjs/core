import type { SignalReadable, SignalWritable } from "."
import { createSignalReadable, createSignalWritable, isSignalReadable } from "."

type EachOfArrayBuilder<TSource extends unknown[]> = {
	as<TResultItem>(as: (item: TSource[number], index: number) => TResultItem): TResultItem[]
}

function eachOfArray<TSource extends unknown[]>(each: TSource): EachOfArrayBuilder<TSource> {
	return { as: each.map.bind(each) }
}

type EachOfSignalArrayBuilder<T extends unknown[]> = {
	key(getter: EachOfSignalArrayBuilder.KeyGetter<T>): EachOfSignalArrayBuilder.As<T>
} & EachOfSignalArrayBuilder.As<T>
namespace EachOfSignalArrayBuilder {
	export type As<TSource extends unknown[]> = {
		as<TResultItem>(as: (item: SignalReadable<TSource[number]>, index: SignalReadable<number>) => TResultItem): SignalReadable<TResultItem[]>
	}
	export type KeyGetter<T extends unknown[]> = (item: T[number], index: number) => unknown
}

function eachOfSignalArray<TSource extends unknown[]>(each: SignalReadable<TSource>): EachOfSignalArrayBuilder<TSource> {
	function as(keyGetter: EachOfSignalArrayBuilder.KeyGetter<TSource>): EachOfSignalArrayBuilder.As<TSource> {
		return {
			as<TResultItem>(as: (item: SignalReadable<TSource[number]>, index: SignalReadable<number>) => TResultItem): SignalReadable<TResultItem[]> {
				const caches = new Map<
					unknown,
					{ itemSignal: SignalWritable<TSource[number]>; indexSignal: SignalWritable<number>; value: TResultItem }
				>()

				return createSignalReadable<TResultItem[]>(
					(set) =>
						each.subscribe(
							(sourceItems) => {
								const toRemove = new Set(caches.keys())

								const items = sourceItems.map((sourceItem, index): TResultItem => {
									const key = keyGetter(sourceItem, index)
									toRemove.delete(key)

									const cache = caches.get(key)
									if (cache) {
										cache.itemSignal.set(sourceItem)
										cache.indexSignal.set(index)
										return cache.value
									}

									const itemSignal = createSignalWritable(sourceItem)
									const indexSignal = createSignalWritable(index)
									const value = as(itemSignal, indexSignal)

									caches.set(key, { itemSignal, indexSignal, value })

									return value
								})

								for (const key of toRemove) caches.delete(key)

								set(items)
							},
							{ mode: "immediate" }
						).unsubscribe
				)
			},
		}
	}

	return {
		key(keyGetter) {
			return as(keyGetter)
		},
		...as((item) => item),
	}
}

export const createEach: {
	<T extends unknown[]>(each: T): EachOfArrayBuilder<T>
	<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArrayBuilder<T>
} = (each) => {
	if (isSignalReadable(each)) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
