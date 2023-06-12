import { isSignalReadable } from "../signal.js"
import { createOrGetDeriveOfFunction } from "../signal/derive.js"
import { RenderSymbol, isRenderable } from "./renderable.js"

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
				while (startComment.nextSibling && startComment.nextSibling !== endComment) {
					const node = startComment.nextSibling
					node.remove()
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
