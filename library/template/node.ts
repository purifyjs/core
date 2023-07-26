import { createOrGetDeriveOfFunction } from "../signal/derive"
import { isSignalReadable } from "../signal/index"
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

		value.subscribe$(
			startComment,
			(signalValue: unknown) => {
				/* 
					TODO: Modify this in a way that we don't need to remove all nodes.
					We should only remove the nodes that are not in the new value.
					Arrays handled in the same way too.
				*/

				while (startComment.nextSibling && startComment.nextSibling !== endComment) {
					const node = startComment.nextSibling
					node.remove()
				}

				if (Array.isArray(signalValue)) {
					for (const item of signalValue) {
						const itemStartComment = document.createComment(`item`)
						const itemEndComment = document.createComment(`/item`)

						endComment.before(itemStartComment)
						endComment.before(valueToNode(item))
						endComment.before(itemEndComment)
					}

					return
				}

				endComment.before(valueToNode(signalValue))
			},
			{ mode: "immediate" }
		)

		return fragment
	}

	if (isRenderable(value)) return valueToNode(value[RenderSymbol]())

	return document.createTextNode(`${value}`)
}
