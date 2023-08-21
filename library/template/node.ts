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

		type Item = { value: unknown; startComment: Comment; endComment: Comment }
		const itemNodes = new WeakMap<ChildNode, Item>()
		function createItem(value: unknown): DocumentFragment {
			const fragment = document.createDocumentFragment()
			const itemStartComment = document.createComment(`item ${value}`)
			const itemEndComment = document.createComment(`/item ${value}`)

			fragment.append(itemStartComment)
			fragment.append(valueToNode(value))
			fragment.append(itemEndComment)

			itemNodes.set(itemStartComment, { value, startComment: itemStartComment, endComment: itemEndComment })

			return fragment
		}
		function removeItem(item: Item) {
			while (item.startComment.nextSibling !== item.endComment) item.startComment.nextSibling!.remove()
			item.startComment.remove()
			item.endComment.remove()
		}

		value.subscribe$(
			startComment,
			(signalValue: unknown) => {
				if (Array.isArray(signalValue)) {
					let currentNode: ChildNode = startComment.nextSibling!
					for (let currentIndex = 0; currentIndex < signalValue.length; currentIndex++) {
						const nextIndex = currentIndex + 1
						const currentValue = signalValue[currentIndex] as unknown

						while (true) {
							if (currentNode === endComment) {
								endComment.before(createItem(currentValue))
								break
							}

							const currentItem = itemNodes.get(currentNode)
							if (currentItem) {
								if (currentValue === currentItem.value) {
									currentNode = currentItem.endComment.nextSibling!
									break
								}

								const nextItem = itemNodes.get(currentItem.endComment.nextSibling!)

								if (nextItem && currentValue === nextItem.value) {
									removeItem(currentItem)
									currentNode = nextItem.endComment.nextSibling!
								} else {
									const newItemFragment = createItem(currentValue)
									const newItemFragmentLastChild = newItemFragment.lastChild!

									currentItem.startComment.before(newItemFragment)

									if (nextIndex >= signalValue.length || signalValue[nextIndex] !== currentItem.value) {
										removeItem(currentItem)
										currentNode = newItemFragmentLastChild.nextSibling!
									} else {
										currentIndex = nextIndex
										currentNode = currentItem.endComment.nextSibling!
									}
								}

								break
							}

							currentNode = currentNode.nextSibling!
						}
					}

					if (currentNode !== endComment) {
						while (currentNode.nextSibling !== endComment) currentNode.nextSibling!.remove()
						currentNode.remove()
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
