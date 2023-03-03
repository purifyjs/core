import { isTemplatable } from "."
import { makeMountableNode } from "../mountable"
import { createOrGetDeriveOfFunction } from "../signal/derive"
import { SignalReadable } from "../signal/readable"

const EMPTY_NODE = document.createDocumentFragment()

export function valueToNode(value: unknown): Node {
	if (value === null) return EMPTY_NODE
	if (value instanceof Node) return value
	if (value instanceof Array) {
		const fragment = document.createDocumentFragment()
		for (const item of value) fragment.append(valueToNode(item))
		return fragment
	}
	if (value instanceof Function) return valueToNode(createOrGetDeriveOfFunction<unknown>(value as never))
	if (value instanceof SignalReadable) {
		const fragment = document.createDocumentFragment()
		const startComment = document.createComment(``)
		const endComment = document.createComment(``)
		fragment.append(startComment, endComment)

		startComment.nodeValue = `signal ${value.id}`
		endComment.nodeValue = `/signal ${value.id}`

		makeMountableNode(startComment)
		startComment.$subscribe(
			value,
			(signalValue) => {
				while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
				endComment.before(valueToNode(signalValue))
			},
			{ mode: "immediate" }
		)

		return fragment
	}

	if (isTemplatable(value)) return valueToNode(value.toTemplateValue())

	return document.createTextNode(`${value}`)
}
