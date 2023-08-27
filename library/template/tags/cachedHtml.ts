import type { TemplateShape } from "../parse/shape"
import { createTemplateFromShape } from "../parse/template"
import { render } from "../render"
import type { TemplateValue } from "../types"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml(shape: TemplateShape, template?: HTMLTemplateElement) {
	template ??= createTemplateFromShape(shape)
	return (_: TemplateStringsArray, ...values: TemplateValue[]) => {
		return render(template!, shape, values)
	}
}
