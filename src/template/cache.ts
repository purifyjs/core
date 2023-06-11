import type { TemplateValue } from "."
import type { TemplateDescriptor } from "./parse/descriptor"
import { parseTemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { parseTemplate } from "./parse/template"
import { render } from "./render"

// TODO: Don't need to cache this later, preproccesor should parse it on build time once, without preproccesor it will just parse on runtime
// Descriptor can be placed inside the code, and template can be placed to <head> in index.html

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
