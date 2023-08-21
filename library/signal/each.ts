import type { SignalReadable, SignalWritable } from "."
import { createSignalReadable, createSignalWritable } from "."

export type SignalEachBuilder<T extends unknown[]> = {
	key(getter: SignalEachBuilder.KeyGetter<T>): SignalEachBuilder.As<T>
} & SignalEachBuilder.As<T>
export namespace SignalEachBuilder {
	export type As<TSource extends unknown[]> = {
		as<TResultItem>(as: (item: SignalReadable<TSource[number]>, index: SignalReadable<number>) => TResultItem): SignalReadable<TResultItem[]>
	}
	export type KeyGetter<T extends unknown[]> = (item: T[number], index: number) => unknown
}

export function createSignalEach<TSource extends unknown[]>(each: SignalReadable<TSource>): SignalEachBuilder<TSource> {
	function as(keyGetter: SignalEachBuilder.KeyGetter<TSource>): SignalEachBuilder.As<TSource> {
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
