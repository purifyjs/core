import { mountableNodeAssert } from "../mountable"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { SignalReadable } from "../signal"
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

	if (value instanceof SignalReadable) {
		const fragment = document.createDocumentFragment()
		const startComment = document.createComment(`signal ${value.id}`)
		const endComment = document.createComment(`/signal ${value.id}`)
		fragment.append(startComment, endComment)

		mountableNodeAssert(startComment)
		startComment.$subscribe(
			value,
			(signalValue) => {
				// TODO: find out why we don't have nextSibiling sometimes, why we are not in the dom
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
