import { populate, tagsNS, type TagsNS } from "master-ts/core.ts"

let counter = 0n
let uniqueId = () => Math.random().toString(36).slice(2) + (counter++).toString(36)

export let html = (strings: TemplateStringsArray, ...values: (TagsNS.AcceptedChild | EventListener)[]) => {
	let placeholders: string[] = new Array(values.length)
	let html = strings
		.map((part, i) => part + (i < placeholders.length ? (placeholders[i] = `x${uniqueId()}`) : ""))
		.join("")
		.trim()

	let fn = () => {
		let args = { p: placeholders, v: values, i: 0 } as const satisfies HydrateArgs
		let template = tagsNS.template()
		template.innerHTML = html
		return Array.from(template.content.childNodes)
			.map((node) => hydrate(node, args))
			.flat()
	}

	return fn()
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
			result.push(document.createTextNode(text.slice(i, placeholderIndex)), args.v[args.i++]!)
			i = placeholderIndex + args.p[args.i - 1]!.length
		}
		return result ? (result.push(document.createTextNode(text.slice(i))), node.remove(), result) : [node]
	}

	return node instanceof Element
		? [
				populate(
					node.tagName === "X" ? (node.remove(), args.v[args.i++] as Element) : node,
					Array.from(node.attributes).reduce(
						(attr, { name, value }) => (
							(attr[name] = value === args.p[args.i] ? args.v[args.i++] : value), attr
						),
						{} as TagsNS.Attributes<Element>
					),
					Array.from(node.childNodes)
						.map((childNode) => hydrate(childNode, args))
						.flat()
				)
		  ]
		: [node]
}
