import { Template } from "../node"
import { createTemplateShape } from "../parse/shape"
import { tokenizeTemplate } from "../parse/tokenizer"
import { render } from "../render"

export function html<S extends TemplateStringsArray, T extends Template.Value[]>(strings: S, ...values: T) {
	const shape = createTemplateShape(tokenizeTemplate(strings))
	const template = document.createElement("template")
	template.innerHTML = shape.html
	return render(template, shape, values)
}
