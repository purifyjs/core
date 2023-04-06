import { makeMountableNode } from "../mountable"
import { createDerive } from "../signal/derive"
import { SignalReadable } from "../signal/readable"
import { createWritable, SignalWritable } from "../signal/writable"
import { valueToNode } from "../template/node"
import { RenderSymbol } from "../template/renderable"

type KeyGetter<T> = (item: T, index: number) => unknown

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): Omit<this, "key">
	as<R>(as?: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R): Omit<this, "as">
	[RenderSymbol](): DocumentFragment
}

interface EachOfArray<T extends unknown[]> {
	as<R>(as: (item: T[number], index: number) => R): R[]
	as(): T
	[RenderSymbol](): T
}

function eachOfArray<T extends unknown[]>(each: T) {
	return {
		as<R>(as?: (item: T[number], index: number) => R): R[] | T {
			return as ? each.map((item, index) => as(item, index)) : each
		},
		[RenderSymbol]() {
			return this.as()
		},
	} as EachOfArray<T>
}

function eachOfSignalArray<T extends unknown[]>(each: SignalReadable<T>) {
	let _keyGetter: KeyGetter<T[number]>
	let _as: ((item: SignalReadable<T[number]>, index: SignalReadable<number>) => unknown) | undefined

	return {
		key(keyGetter: KeyGetter<T[number]>) {
			delete (this as Partial<typeof this>).key
			_keyGetter = keyGetter
			return this
		},
		as<R>(as?: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			delete (this as Partial<typeof this>).as
			_as = as
			return this
		},
		[RenderSymbol]() {
			_keyGetter ??= (_, index) => index
			let caches = new Map<unknown, { nodes: ChildNode[]; indexSignal: SignalWritable<number> }>()
			let keyOrder: unknown[] = []

			const startComment = document.createComment("each")
			const endComment = document.createComment("/each")

			const fragment = document.createDocumentFragment()
			fragment.append(startComment, endComment)

			makeMountableNode(startComment)
			startComment.$subscribe(
				each,
				(eachValue) => {
					let newCaches: typeof caches = new Map()
					let newKeyOrder: typeof keyOrder = new Array(eachValue.length)
					let lastNode: ChildNode = startComment

					eachValue.forEach((item, index) => {
						const key = _keyGetter(item, index)
						const cache = caches.get(key)
						let nodes: ChildNode[]
						if (cache) {
							cache.indexSignal.ref = index
							newCaches.set(key, cache)
							newKeyOrder[index] = key
							nodes = cache.nodes
						} else {
							const indexSignal = createWritable(index)
							// we need itemSignal because when array changes also the item should hcange even though item has the same key
							// i mean this sounds correct but maybe it shouldn't change idk
							// alternative is just using the item, not signal, and having a different key
							const itemSignal = createDerive(() => each.ref[indexSignal.ref])
							const value = _as ? _as(itemSignal, indexSignal) : itemSignal
							const node = valueToNode(value)
							nodes = node instanceof DocumentFragment ? Array.from(node.childNodes) : [node as ChildNode]
							newCaches.set(key, { nodes, indexSignal })
							newKeyOrder[index] = key
						}
					})

					for (let i = 0; i < newKeyOrder.length; i++) {
						const newKey = newKeyOrder[i]
						const oldKey = keyOrder[i]

						const newNodes = newCaches.get(newKey)!.nodes
						const oldNodes = caches.get(oldKey)?.nodes

						if (oldNodes && oldKey !== newKey && !newCaches.has(oldKey)) oldNodes.forEach((node) => node.remove())
						if (lastNode.nextSibling !== newNodes[0]) lastNode.after(...newNodes)
						lastNode = newNodes[newNodes.length - 1]!
					}

					while (lastNode.nextSibling !== endComment) lastNode.nextSibling!.remove()

					caches = newCaches
					keyOrder = newKeyOrder
				},
				{ mode: "immediate" }
			)

			return fragment
		},
	} as EachOfSignalArray<T>
}

export const createEach: {
	<T extends unknown[]>(each: T): EachOfArray<T>
	<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArray<T>
} = (each) => {
	if (each instanceof SignalReadable) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
