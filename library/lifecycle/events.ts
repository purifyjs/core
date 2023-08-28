import { onMount$ } from "."
import { isFunction } from "../utils/bundleHelpers"

export function onEvent$<TNode extends Node>(node: TNode, ...args: Parameters<typeof node.addEventListener>) {
	onMount$(node, () => {
		const [key, listener, ...other] = args
		node.addEventListener(
			key,
			listener &&
				(isFunction(listener)
					? (...args) => node.isConnected && listener(...args)
					: {
							handleEvent: (...args) => node.isConnected && listener.handleEvent(...args),
					  }),
			...other
		)
		return () => node.removeEventListener(...args)
	})
}
