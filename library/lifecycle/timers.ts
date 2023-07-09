import { onMount$ } from "./index"

export function createTimeout$<T>(node: Node, callback: () => T, delay: number) {
	onMount$(node, () => {
		const timeout = setTimeout(callback, delay)
		return () => clearTimeout(timeout)
	})
}

export function createInterval$<T>(node: Node, callback: () => T, delay: number) {
	onMount$(node, () => {
		const interval = setInterval(callback, delay)
		return () => clearInterval(interval)
	})
}
