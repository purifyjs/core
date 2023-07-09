import { unhandled } from "../../utils/unhandled"
import type { TemplateDescriptor } from "./descriptor"

export function parseTemplate({ refDataMap, valueDescriptors, html }: TemplateDescriptor) {
	try {
		const template = document.createElement("template")
		template.innerHTML = html.trim()

		for (let index = 0; index < valueDescriptors.length; index++) {
			const descriptor = valueDescriptors[index]!
			const element = template.content.querySelector(`[ref\\:${descriptor.ref}]`) as HTMLElement
			if (!element) throw new Error(`Could not find outlet with ref "${descriptor.ref}". For type ${descriptor.type}`)

			if (descriptor.type === "directive") {
				// TODO: Using if/else because vite breaks the code while optimizing it for the build, convert to switch later
				if (descriptor.directive === "class") {
				} else if (descriptor.directive === "style") {
				} else if (descriptor.directive === "on") {
				} else if (descriptor.directive === "ref") {
				} else if (descriptor.directive === "bind") {
					switch (descriptor.name) {
						case "value": {
							if (element instanceof HTMLInputElement) {
								switch (element.type) {
									case "radio":
									case "checkbox":
										descriptor.name = "value:boolean"
										break
									case "range":
									case "number":
										descriptor.name = "value:number"
										break
									case "date":
									case "datetime-local":
									case "month":
									case "time":
									case "week":
										descriptor.name = "value:date"
										break
									default:
										descriptor.name = "value:string"
										break
								}
								break
							} else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
								descriptor.name = "value:string"
								break
							}

							throw new Error(`${element.tagName} does not support binding to ${descriptor.name}`)
						}
						default:
							throw new Error(`Unknown binding key ${descriptor.name}`)
					}
				} else {
					unhandled("Unhandled directive type", descriptor.directive)
				}
			}
		}

		for (const [ref, { attributes }] of refDataMap) {
			const element = template.content.querySelector(`[ref\\:${ref}]`) as HTMLElement

			for (const [name, attribute] of attributes) {
				const attributeTemplateString = element.getAttribute(name)
				if (!attributeTemplateString) throw new Error(`Could not find attribute "${name}" on element with ref "${ref}".`)
				attribute.parts = attributeTemplateString
					.split(ref)
					.filter((s) => s)
					.flatMap((part, index) => {
						const valueIndex = attribute.indexes[index]
						if (valueIndex === undefined)
							throw new Error(`Could not find value index of ${index}th part of attribute "${name}" on element with ref "${ref}".`)
						return [part, valueIndex]
					})
			}
		}

		return template
	} catch (error) {
		console.error("Error while parsing template:", error, "At:", html.slice(-256).trim())
		throw error
	}
}
