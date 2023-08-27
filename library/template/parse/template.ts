import { unhandled } from "../../utils/unhandled"
import type { TemplateShape } from "./shape"

export function createTemplateFromShape(shape: TemplateShape): HTMLTemplateElement {
	try {
		const template = document.createElement("template")
		template.innerHTML = shape.html.trim()

		for (let index = 0; index < shape.items.length; index++) {
			const item = shape.items[index]!
			const element = template.content.querySelector(`[ref\\:${item.ref}]`) as HTMLElement
			if (!element) throw new Error(`Could not find outlet with ref "${item.ref}". For type ${item.itemType}`)

			if (item.itemType === "dir") {
				switch (item.directiveType) {
					case "class":
					case "style":
					case "on":
					case "ref":
						break
					case "bind": {
						switch (item.name) {
							case "value": {
								if (element instanceof HTMLInputElement) {
									switch (element.type) {
										case "radio":
										case "checkbox":
											item.name = "value:boolean"
											break
										case "range":
										case "number":
											item.name = "value:number"
											break
										case "date":
										case "datetime-local":
										case "month":
										case "time":
										case "week":
											item.name = "value:date"
											break
										default:
											item.name = "value:string"
											break
									}
									break
								} else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
									item.name = "value:string"
									break
								}

								throw new Error(`${element.tagName} does not support binding to ${item.name}`)
							}
							default:
								throw new Error(`Unknown binding key ${item.name}`)
						}
						break
					}
					default:
						unhandled("Unhandled directive type", item.directiveType)
				}
			}
		}

		for (const [ref, { attributes }] of shape.refDataMap) {
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
		console.error("Error while parsing template:", error, "At:", shape.html.slice(-256).trim())
		throw error
	}
}
