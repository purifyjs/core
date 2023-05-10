import { MountableNode } from "../mountable"
import type { SignalReadable, SignalWritable } from "../signal"
import { createReadable, createWritable, isReadable } from "../signal"
import { valueToNode } from "../template/node"

// TODO: Rewrite this all, re-think it
// TODO: we can move rendering to SignalReadnable itself, it can render Maps in this way, and this would return a SignalReadable<Map<Foo, Bar>>

type KeyGetter<T> = (item: T, index: number) => unknown

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): Omit<this, "key">
	as<R>(as?: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R): DocumentFragment
}

interface EachOfArray<T extends unknown[]> {
	as<R>(as: (item: T[number], index: number) => R): R[]
	as(): T
}

function eachOfArray<T extends unknown[]>(each: T) {
	return {
		as<R>(as?: (item: T[number], index: number) => R): R[] | T {
			return as ? each.map((item, index) => as(item, index)) : each
		},
	} as EachOfArray<T>
}

function eachOfSignalArray<T extends unknown[]>(each: SignalReadable<T>) {
	let _keyGetter: KeyGetter<T[number]>

	return {
		key(keyGetter: KeyGetter<T[number]>) {
			delete (this as Partial<typeof this>).key
			_keyGetter = keyGetter
			return this
		},
		as<R>(as?: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			delete (this as Partial<typeof this>).as

			_keyGetter ??= (_, index) => index
			let caches = new Map<unknown, { nodes: ChildNode[]; indexSignal: SignalWritable<number> }>()
			let keyOrder: unknown[] = []

			const startComment = document.createComment("each")
			const endComment = document.createComment("/each")

			const fragment = document.createDocumentFragment()
			fragment.append(startComment, endComment)

			MountableNode.make(startComment)
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
							const currentValue = () => each.ref[indexSignal.ref]
							const itemSignal = createReadable<T[number]>((set) => {
								let lastValue = currentValue()
								set(lastValue)
								function update() {
									if (indexSignal.ref >= eachValue.length) return
									const value = currentValue()
									if (value !== lastValue) {
										set(value)
										lastValue = value
									}
								}
								const subs = [each.subscribe(update), indexSignal.subscribe(update)]
								return () => subs.forEach((sub) => sub.unsubscribe())
							})
							const value = as ? as(itemSignal, indexSignal) : itemSignal
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

						if (oldNodes && oldKey !== newKey && !newCaches.has(oldKey))
							oldNodes.forEach((node) => {
								node.remove()
								MountableNode.removedNode(node)
							})
						if (lastNode.nextSibling !== newNodes[0]) lastNode.after(...newNodes)
						lastNode = newNodes[newNodes.length - 1]!
					}

					while (lastNode.nextSibling && lastNode.nextSibling !== endComment) {
						const node = lastNode.nextSibling
						node.remove()
						MountableNode.removedNode(node)
					}

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
	if (isReadable(each)) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
