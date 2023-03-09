import { createDerive } from "./derive"
import { SignalReadable } from "./readable"
import { createWritable, SignalWritable } from "./writable"

type KeyGetter<T> = (item: T, index: number) => unknown

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): this
	$<R>(as: (item: T[number], index: SignalReadable<number>) => R): SignalReadable<R[]>
}

interface EachOfArray<T extends unknown[]> {
	$<R>(as: (item: T[number], index: number) => R): R[]
}

function isEachSignal<T extends unknown[]>(each: unknown): each is SignalReadable<T> {
	return each instanceof SignalReadable
}

export function createEach<U extends SignalReadable<any[]> | any[]>(
	each: U
): U extends SignalReadable<infer T> ? (T extends unknown[] ? EachOfSignalArray<T> : never) : U extends unknown[] ? EachOfArray<U> : never {
	type T = U extends SignalReadable<infer T> ? T : U

	if (isEachSignal(each)) {
		let keyGetter: KeyGetter<T[number]> | null = null
		let done = false

		return {
			key(getter: KeyGetter<T[number]>) {
				if (keyGetter) throw new Error("key getter already set")
				keyGetter = getter
				return this
			},
			$<R>(as: (item: T[number], index: SignalReadable<number>) => R) {
				if (done) throw new Error("each is already done")
				done = true

				if (!keyGetter) keyGetter = (item) => item

				let caches = new Map<unknown, { index: SignalWritable<number>; value: R }>()
				const derived = createDerive((s) => {
					const newCaches: typeof caches = new Map()
					const collection = s(each).ref
					const results = collection.map((item, index) => {
						const key = keyGetter!(item, index)

						const cache = caches.get(key)
						if (cache) {
							cache.index.ref = index
							newCaches.set(key, cache)
							return cache.value
						} else {
							const indexSignal = createWritable(index)
							const value = as(item, indexSignal)
							newCaches.set(key, { index: indexSignal, value })
							return value
						}
					})
					caches = newCaches
					return results
				})

				return derived
			},
		} as never
	}

	return {
		$<R>(as: (item: T[number], index: number) => R) {
			return each.map((item, index) => as(item, index))
		},
	} as never
}
