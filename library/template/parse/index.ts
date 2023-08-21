import { parseTemplateDescriptor } from "./descriptor"
import { parseTemplateHtml } from "./html"
import { parseTemplate } from "./template"

export namespace parse {
	export const template = parseTemplate
	export const descriptor = parseTemplateDescriptor
	export const html = parseTemplateHtml
}
