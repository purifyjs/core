import type { TemplateValue } from "."
import { parseTemplateDescriptor, TemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { render } from "./render"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml() {
	let descriptorCache: TemplateDescriptor | null = null
	return (strings: TemplateStringsArray, ...values: TemplateValue[]) => {
		descriptorCache ??= parseTemplateDescriptor(parseTemplateHtml(strings))
		return render(descriptorCache, values)
	}
}
