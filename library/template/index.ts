import { SignalReadable } from "../signal"
import { parseTemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { parseTemplate } from "./parse/template"
import { render } from "./render"
import type { Renderable } from "./renderable"

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
