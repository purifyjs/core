import type { TemplateValue } from "."
import { parseTemplateDescriptor } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"
import { render } from "./render"

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T) {
	return render(parseTemplateDescriptor(parseTemplateHtml(strings)), values)
}
