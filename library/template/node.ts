import { isSignalReadable } from "../signal"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { RenderSymbol, isRenderable } from "./renderable"

const EMPTY_NODE = document.createDocumentFragment()

export function valueToNode(value: unknown): Node {
	if (value === null) return EMPTY_NODE
	if (value instanceof Node) return value

	if (value instanceof Array) {
		const fragment = document.createDocumentFragment()
		fragment.append(...value.map((item) => valueToNode(item)))
		return fragment
	}

	if (typeof value === "function") return valueToNode(createOrGetDeriveOfFunction(value as () => unknown))

	if (isSignalReadable(value)) {
		const fragment = document.createDocumentFragment()
		const startComment = document.createComment(`signal ${value.id}`)
		const endComment = document.createComment(`/signal ${value.id}`)
		fragment.append(startComment, endComment)

		const itemNodes = new WeakMap<ChildNode, { value: unknown; endComment: Comment }>()
		function createItem(value: unknown): DocumentFragment {
			const fragment = document.createDocumentFragment()
			const itemStartComment = document.createComment(`item ${value}`)
			const itemEndComment = document.createComment(`/item ${value}`)

			fragment.append(itemStartComment)
			fragment.append(valueToNode(value))
			fragment.append(itemEndComment)

			itemNodes.set(itemStartComment, { value, endComment: itemEndComment })

			return fragment
		}
		function removeItem(itemStartComment: Comment & ChildNode) {
			const { endComment: itemEndComment } = itemNodes.get(itemStartComment)!
			while (itemStartComment.nextSibling !== itemEndComment) itemStartComment.nextSibling!.remove()
			itemStartComment.remove()
			itemEndComment.remove()
		}

		value.subscribe$(
			startComment,
			(signalValue: unknown) => {
				if (Array.isArray(signalValue)) {
					// TODO: This can be better.
					let nextNode: ChildNode = startComment.nextSibling!
					for (const value of signalValue) {
						while (true) {
							if (nextNode === endComment) {
								endComment.before(createItem(value))
								break
							}

							const itemCache = itemNodes.get(nextNode)
							if (itemCache) {
								const itemCacheStartComment = nextNode as Comment & ChildNode
								const { value: itemCacheValue, endComment: itemCacheEndComment } = itemCache

								if (value === itemCacheValue) {
									nextNode = itemCacheEndComment.nextSibling!
									break
								}

								const itemFragment = createItem(value)
								const itemFragmentLastChild = itemFragment.lastChild!

								nextNode.before(itemFragment)
								removeItem(itemCacheStartComment)

								nextNode = itemFragmentLastChild.nextSibling!
								break
							}

							nextNode = nextNode.nextSibling!
						}
					}

					if (nextNode !== endComment) {
						while (nextNode.nextSibling !== endComment) nextNode.nextSibling!.remove()
						nextNode.remove()
					}
				} else {
					while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
					endComment.before(valueToNode(signalValue))
				}
			},
			{ mode: "immediate" }
		)

		return fragment
	}

	if (isRenderable(value)) return valueToNode(value[RenderSymbol]())

	return document.createTextNode(`${value}`)
}
