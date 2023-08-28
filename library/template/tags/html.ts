import { createTemplateShape } from "../parse/shape"
import { tokenizeTemplate } from "../parse/tokenizer"
import { render } from "../render"
import { TemplateValue } from "../types"

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T) {
	const shape = createTemplateShape(tokenizeTemplate(strings))
	const template = document.createElement("template")
	template.innerHTML = shape.html
	return render(template, shape, values)
}
