import { mountableNodeAssert } from "../mountable"
import { isReadable } from "../signal"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { isRenderable, RenderSymbol } from "./renderable"

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

	if (isReadable(value)) {
		const fragment = document.createDocumentFragment()
		const startComment = document.createComment(`signal ${value.id}`)
		const endComment = document.createComment(`/signal ${value.id}`)
		fragment.append(startComment, endComment)

		mountableNodeAssert(startComment)
		startComment.$subscribe(
			value,
			(signalValue: unknown) => {
				if (!startComment.nextSibling) {
					console.warn("THE WEIRD")
					console.log(startComment)
					console.log(endComment)
				}
				while (startComment.nextSibling && startComment.nextSibling !== endComment) startComment.nextSibling.remove()
				endComment.before(valueToNode(signalValue))
			},
			{ mode: "immediate" }
		)

		return fragment
	}

	if (isRenderable(value)) return valueToNode(value[RenderSymbol]())

	return document.createTextNode(`${value}`)
}
