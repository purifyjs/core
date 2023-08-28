import { createElement } from "../../utils/bundleHelpers"
import type { TemplateShape } from "../parse/shape"
import { render } from "../render"
import type { TemplateValue } from "../types"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml(shape: TemplateShape) {
	const template = createElement("template")
	template.innerHTML = shape.html
	return (_: TemplateStringsArray, ...values: TemplateValue[]) => {
		return render(template, shape, values)
	}
}
