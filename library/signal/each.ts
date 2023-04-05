import { makeMountableNode } from "../mountable"
import { SignalReadable } from "../signal/readable"
import type { SignalWritable } from "../signal/writable"
import { valueToNode } from "../template/node"
import { $ } from "./$"

type KeyGetter<T> = (item: T, index: number) => unknown

interface EachOfSignalArray<T extends unknown[]> {
	key(getter: KeyGetter<T[number]>): this
	as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R): DocumentFragment
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
	let keyGetter: KeyGetter<T[number]> = null!

	return {
		key(getter: KeyGetter<T[number]>) {
			delete (this as Partial<typeof this>).key
			keyGetter = getter
			return this
		},
		as<R>(as: (item: SignalReadable<T[number]>, index: SignalReadable<number>) => R) {
			delete (this as Partial<typeof this>).as
			if (!keyGetter) keyGetter = (_, index) => index
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
						const key = keyGetter(item, index)
						const cache = caches.get(key)
						let nodes: ChildNode[]
						if (cache) {
							cache.indexSignal.ref = index
							newCaches.set(key, cache)
							newKeyOrder[index] = key
							nodes = cache.nodes
						} else {
							const indexSignal = $.writable(index)
							const itemSignal = $.derive(() => each.ref[indexSignal.ref])
							const value = as(itemSignal, indexSignal)
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
	}
}

export const createEach: {
	<T extends unknown[]>(each: T): EachOfArray<T>
	<T extends unknown[]>(each: SignalReadable<T>): EachOfSignalArray<T>
} = (each) => {
	if (each instanceof SignalReadable) return eachOfSignalArray(each) as never
	return eachOfArray(each) as never
}
