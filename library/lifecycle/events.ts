import { onMount$ } from "."

export function onEvent$<TNode extends Node>(node: TNode, ...args: Parameters<typeof node.addEventListener>) {
	onMount$(node, () => {
		node.addEventListener(...args)
		return () => node.removeEventListener(...args)
	})
}
