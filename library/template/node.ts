import { isSignalReadable } from "../signal"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { append, createComment, createFragment, createTextNode, insertBefore, isFunction, isNull, nextSibling, remove } from "../utils/bundleHelpers"
import { uniqueId } from "../utils/id"

const EMPTY_NODE = createFragment()
const signalCommentRange = new WeakMap<Comment, Comment>()
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
		const signal = value
		const fragment = createFragment()
		const startComment = createComment(`signal ${signal.id}`)
		const endComment = createComment(`/signal ${signal.id}`)
		append(fragment, startComment, endComment)
		signalCommentRange.set(startComment, endComment)

		const fragmentOfSignalItems = new WeakMap<Comment, DocumentFragment>()
		type Item = { value: unknown; startComment: Comment; endComment: Comment; fragment: DocumentFragment }
		const itemNodes = new WeakMap<ChildNode, Readonly<Item>>()
		function createItem(value: unknown): Readonly<Item> {
			const id = uniqueId()
			const fragment = createFragment()
			const itemStartComment = createComment(`item ${id} of ${signal.id}`)
			const itemEndComment = createComment(`/item ${id} of ${signal.id}`)

			append(fragment, itemStartComment)
			append(fragment, valueToNode(value))
			append(fragment, itemEndComment)

			const self: Item = { value: value, startComment: itemStartComment, endComment: itemEndComment, fragment }
			itemNodes.set(itemStartComment, self)

			return self
		}

		function removeItem(item: Item) {
			while (nextSibling(item.startComment) !== item.endComment) remove(nextSibling(item.startComment)!)
			remove(item.startComment)
			remove(item.endComment)
		}

		signal.subscribe$(
			startComment,
			(signalValue: unknown) => {
				if (Array.isArray(signalValue)) {
					let currentNode: ChildNode = nextSibling(startComment)!

					// Here we need to make signals in the array into a signal item
					// For this we used fragment to wrap all of the nodes of the signal item
					// This is needed otherwise code below this one will treat every node in a signal as a separate item
					// And this will cause error, by placeing for example signal start and end comment in different items
					const values: unknown[] = []
					{
						for (let index = 0; index < signalValue.length; index++) {
							let value = signalValue[index] as unknown

							if (value instanceof Node && signalCommentRange.has(value as Comment)) {
								const fragment =
									fragmentOfSignalItems.get(value as Comment) ??
									(() => {
										const fragment = createFragment()
										fragmentOfSignalItems.set(value as Comment, fragment)
										return fragment
									})()
								const endComment = signalCommentRange.get(value as Comment)!

								while (value !== endComment) {
									if (!(value instanceof Node)) throw new Error("Expected Node")
									append(fragment, value)
									value = signalValue[++index] as Node
									if (index >= signalValue.length) throw new Error("Expected end of signal")
								}
								append(fragment, endComment)
								value = fragment
							}
							values.push(value)
						}
					}

					for (let currentIndex = 0; currentIndex < values.length; currentIndex++) {
						let currentValue = values[currentIndex] as unknown
						const nextIndex = currentIndex + 1

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
									insertBefore(currentItem.startComment, newItem.fragment)

									if (nextIndex >= values.length || values[nextIndex] !== currentItem.value) {
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
