import { SignalReadable } from "./signal.js"
import { parseTemplateDescriptor } from "./template/parse/descriptor.js"
import { parseTemplateHtml } from "./template/parse/html.js"
import { parseTemplate } from "./template/parse/template.js"
import { render } from "./template/render.js"
import type { Renderable } from "./template/renderable.js"

export type TemplateValue =
	| string
	| number
	| boolean
	| Node
	| Function
	| EventListener
	| SignalReadable<TemplateValue>
	| Renderable<TemplateValue>
	| null
	| TemplateValue[]
export type Template = {
	strings: TemplateStringsArray
	values: TemplateValue[]
}

export function css(strings: TemplateStringsArray, ...values: (string | number)[]) {
	const styleSheet = new CSSStyleSheet()
	styleSheet.replaceSync(strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""))
	return styleSheet
}

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T) {
	const descriptor = parseTemplateDescriptor(parseTemplateHtml(strings))
	return render(parseTemplate(descriptor), descriptor, values)
}
