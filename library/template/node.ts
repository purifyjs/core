import { isSignalReadable } from "../signal"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { append, createComment, createFragment, createTextNode, insertBefore, isFunction, isNull, nextSibling, remove } from "../utils/bundleHelpers"

const EMPTY_NODE = createFragment()

export function valueToNode(value: unknown): Node {
	if (isNull(value)) return EMPTY_NODE
	if (value instanceof Node) return value

	if (Array.isArray(value)) {
		const fragment = createFragment()
		append(fragment, ...value.map((item) => valueToNode(item)))
		return fragment
	}

	if (isFunction(value)) return valueToNode(createOrGetDeriveOfFunction(value as () => unknown))

	if (isSignalReadable(value)) {
		const fragment = createFragment()
		const startComment = createComment(`signal ${value.id}`)
		const endComment = createComment(`/signal ${value.id}`)
		append(fragment, startComment, endComment)

		type Item = { value: unknown; startComment: Comment; endComment: Comment; fragment: DocumentFragment }
		const itemNodes = new WeakMap<ChildNode, Item>()
		function createItem(value: unknown): Item {
			const fragment = createFragment()
			const itemStartComment = createComment(`item ${value}`)
			const itemEndComment = createComment(`/item ${value}`)

			append(fragment, itemStartComment)
			append(fragment, valueToNode(value))
			append(fragment, itemEndComment)

			const self: Item = { value, startComment: itemStartComment, endComment: itemEndComment, fragment }
			itemNodes.set(itemStartComment, self)

			return self
		}

		function removeItem(item: Item) {
			while (nextSibling(item.startComment) !== item.endComment) remove(nextSibling(item.startComment)!)
			remove(item.startComment)
			remove(item.endComment)
		}

		value.subscribe$(
			startComment,
			(signalValue: unknown) => {
				if (Array.isArray(signalValue)) {
					let currentNode: ChildNode = nextSibling(startComment)!
					for (let currentIndex = 0; currentIndex < signalValue.length; currentIndex++) {
						const nextIndex = currentIndex + 1
						const currentValue = signalValue[currentIndex] as unknown

						while (true) {
							if (currentNode === endComment) {
								const item = createItem(currentValue)
								insertBefore(endComment, item.fragment)
								break
							}

							const currentItem = itemNodes.get(currentNode)
							if (currentItem) {
								if (currentValue === currentItem.value) {
									currentNode = nextSibling(currentItem.endComment)!
									break
								}

								const nextItem = itemNodes.get(nextSibling(currentItem.endComment)!)

								if (nextItem && currentValue === nextItem.value) {
									removeItem(currentItem)
									currentNode = nextSibling(nextItem.endComment)!
								} else {
									const newItem = createItem(currentValue)
									insertBefore(currentItem.endComment, newItem.fragment)

									if (nextIndex >= signalValue.length || signalValue[nextIndex] !== currentItem.value) {
										removeItem(currentItem)
										currentNode = nextSibling(newItem.endComment)!
									} else {
										currentIndex = nextIndex
										currentNode = nextSibling(currentItem.endComment)!
									}
								}

								break
							}

							currentNode = nextSibling(currentNode)!
						}
					}

					if (currentNode !== endComment) {
						while (nextSibling(currentNode) !== endComment) remove(nextSibling(currentNode)!)
						remove(currentNode)
					}
				} else {
					while (nextSibling(startComment) !== endComment) remove(nextSibling(startComment)!)
					insertBefore(endComment, valueToNode(signalValue))
				}
			},
			{ mode: "immediate" }
		)

		return fragment
	}

	return createTextNode(`${value}`)
}
