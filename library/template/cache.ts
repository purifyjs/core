import type { TemplateValue } from "."
import type { TemplateShape } from "./parse/shape"
import { render } from "./render"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml(shape: TemplateShape, template: HTMLTemplateElement) {
	return (_: TemplateStringsArray, ...values: TemplateValue[]) => {
		return render(template, shape, values)
	}
}
