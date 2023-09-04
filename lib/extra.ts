import type { Signal, SignalOrFn, TagsNS } from "./core"
import { derive, populate, signal, tagsNS } from "./core"

let createTextNode = document.createTextNode.bind(document)

let counter = 0n
let uniqueId = () => Math.random().toString(36).slice(2) + (counter++).toString(36)

export let html = (strings: TemplateStringsArray, ...values: TagsNS.AcceptedChild[]) => {
	let placeholders: string[] = new Array(values.length)
	let args = { p: placeholders, v: values, i: 0 } as const satisfies HydrateArgs
	let template = tagsNS.template()
	template.innerHTML = strings
		.map((part, i) => part + (i < placeholders.length ? (placeholders[i] = uniqueId()) : ""))
		.join("")
		.trim()
	return Array.from(template.content.childNodes)
		.map((node) => hydrate(node, args))
		.flat()
}

interface HydrateArgs {
	/**
	 * @name placeholders
	 */
	p: string[]
	/**
	 * @name values
	 */
	v: TagsNS.AcceptedChild[]
	/**
	 * @name index
	 */
	i: number
}

let hydrate = (node: Node, args: HydrateArgs): TagsNS.AcceptedChild[] => {
	if (node instanceof CharacterData) {
		let text = node.nodeValue!
		let i = 0
		let result: TagsNS.AcceptedChild[] | undefined

		let placeholderIndex: number
		while (i < text.length && (placeholderIndex = text.indexOf(args.p[args.i]!, i)) >= 0) {
			result ??= []
			result.push(createTextNode(text.slice(i, placeholderIndex)), args.v[args.i++]!)
			i = placeholderIndex + args.p[args.i - 1]!.length
		}
		return result ? (result.push(createTextNode(text.slice(i))), node.remove(), result) : [node]
	}

	return node instanceof Element
		? [
				populate(
					node.tagName === "X" ? (node.remove(), args.v[args.i++] as Element) : node,
					Array.from(node.attributes).reduce(
						(attr, { name, value }) => ((attr[name] = value === args.p[args.i] ? args.v[args.i++] : value), attr),
						{} as TagsNS.Attributes<Element>
					),
					Array.from(node.childNodes)
						.map((childNode) => hydrate(childNode, args))
						.flat()
				),
		  ]
		: [node]
}

export let css = (strings: TemplateStringsArray, ...values: string[]): CSSStyleSheet => {
	const sheet = new CSSStyleSheet()
	sheet.replaceSync(strings.reduce((acc, part, i) => acc + part + (i < values.length ? values[i] : ""), ""))
	return sheet
}

export let keyedCache = () => {
	const map = new Map<any, any>()
	return {
		key: <T>(key: unknown, fn: () => T): T => {
			if (map.has(key)) return map.get(key)
			const value = fn()
			map.set(key, value)
			return value
		},
	}
}

export let defer = <T>(signalOrFunction: SignalOrFn<T>, timeout_ms = 250): Readonly<Signal<T>> => {
	const sourceSignal = typeof signalOrFunction === "function" ? derive(signalOrFunction) : signalOrFunction
	let timeout = null as NodeJS.Timeout | null
	let follow: Signal.Follow | null = null
	return signal(
		sourceSignal.ref,
		(set) => (
			(follow = sourceSignal.follow((value) => {
				timeout && clearTimeout(timeout)
				timeout = setTimeout(() => ((timeout = null), set(value)), timeout_ms)
			})),
			follow?.unfollow
		)
	)
}

export let awaited = <T, F = null>(promise: Promise<T>, fallback?: (error?: Error) => F): Readonly<Signal<T | F>> => {
	const promiseSignal = signal<T | F>((fallback ? fallback() : null) as F)
	promise.then((value) => (promiseSignal.ref = value))
	fallback && promise.catch((error) => fallback(error))
	return promiseSignal
}
