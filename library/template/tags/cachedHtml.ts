import { createElement } from "../../utils/bundleHelpers"
import { Template } from "../node"
import type { TemplateShape } from "../parse/shape"
import { render } from "../render"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml(shape: TemplateShape) {
	const template = createElement("template")
	template.innerHTML = shape.html
	return (_: TemplateStringsArray, ...values: Template.Value[]) => {
		return render(template, shape, values)
	}
}
