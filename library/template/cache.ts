import type { TemplateValue } from "."
import { parseTemplateDescriptor, TemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { parseTemplate } from "./parse/template"
import { render } from "./render"

/** 
	@internal Use `html` instead. Preprocessor will replace `html` with this. This is internal API.
*/
export function createCachedHtml(descriptor?: TemplateDescriptor, template?: HTMLTemplateElement) {
	return (strings: TemplateStringsArray, ...values: TemplateValue[]) => {
		descriptor ??= parseTemplateDescriptor(parseTemplateHtml(strings))
		template ??= parseTemplate(descriptor)
		return render(template, descriptor, values)
	}
}
