import type { TemplateValue } from "."
import { parseTemplateDescriptor, TemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { parseTemplate } from "./parse/template"
import { render } from "./render"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml() {
	let cache: [HTMLTemplateElement, TemplateDescriptor] | null = null
	return (strings: TemplateStringsArray, ...values: TemplateValue[]) => {
		if (!cache) {
			const descriptor = parseTemplateDescriptor(parseTemplateHtml(strings))
			cache = [parseTemplate(descriptor), descriptor]
		}
		return render(...cache, values)
	}
}
