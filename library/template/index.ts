import { SignalReadable, SignalWritable } from "../signal"
import { createTemplateShape } from "./parse/shape"
import { createTemplateFromShape } from "./parse/template"
import { tokenizeTemplate } from "./parse/tokenizer"
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
	| SignalWritable<TemplateValue | Date>
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
	const shape = createTemplateShape(tokenizeTemplate(strings))
	return render(createTemplateFromShape(shape), shape, values)
}
