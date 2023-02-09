import { randomId } from "../../utils/id"
import { HtmlParseStateType, TemplateHtmlParse } from "./html"
import { instancer } from "master-instancer/library"
import { unhandled } from "../../utils/unhandled"

export class ValueIndex {
	constructor(public index: number) {}
}

export type TemplateValueDescriptor = InstanceType<typeof TemplateValueDescriptor>
export const TemplateValueDescriptor = instancer<{
	ref: string
}>()()

export type TemplateValueDescriptorRenderNode = InstanceType<typeof TemplateValueDescriptorRenderNode>
export const TemplateValueDescriptorRenderNode = instancer<{}>()(TemplateValueDescriptor)

export const TemplateValueDescriptorRenderComponent = instancer<{}>()(TemplateValueDescriptor)
export type TemplateValueDescriptorRenderComponent = InstanceType<typeof TemplateValueDescriptorRenderComponent>

export type TemplateValueDescriptorAttribute = InstanceType<typeof TemplateValueDescriptorAttribute>
export const TemplateValueDescriptorAttribute = instancer<{
	name: string
	quote: "'" | '"' | ""
}>()(TemplateValueDescriptor)

export const templateValueDirectiveTypes = ["class", "style", "on", "bind", "ref"] as const
export type TemplateValueDirectiveType = typeof templateValueDirectiveTypes[number]
export function isTemplateValueDirectiveType(value: string): value is TemplateValueDirectiveType {
	return templateValueDirectiveTypes.includes(value as any)
}
export type TemplateValueDescriptorDirective = InstanceType<typeof TemplateValueDescriptorDirective>
export const TemplateValueDescriptorDirective = instancer<{
	type: TemplateValueDirectiveType
	name: string
}>()(TemplateValueDescriptor)

export interface TemplateDescriptor {
	template: HTMLTemplateElement
	valueDescriptors: TemplateValueDescriptor[]
	multiValueAttributes: Map<string, Map<string, (string | ValueIndex)[]>>
}

export function parseTemplateDescriptor<T extends TemplateHtmlParse>(htmlParse: T): TemplateDescriptor {
	let html = ""

	try {
		const refAttributes: Map<string, Map<string, number[]>> = new Map()
		const multiValueAttributes: TemplateDescriptor["multiValueAttributes"] = new Map()
		const valueDescriptors: TemplateDescriptor["valueDescriptors"] = new Array(htmlParse.parts.length - 1)

		for (let i = 0; i < htmlParse.parts.length; i++) {
			const parsePart = htmlParse.parts[i]!
			html += parsePart.html

			if (!(i < valueDescriptors.length)) break

			if (parsePart.state.type === HtmlParseStateType.Outer) {
				const ref = randomId()
				html += `<x :ref="${ref}"></x>`
				valueDescriptors[i] = new TemplateValueDescriptorRenderNode({ ref })
				continue
			} else if (parsePart.state.type === HtmlParseStateType.TagInner && !parsePart.state.attribute_name) {
				if (parsePart.state.tag === "x") {
					valueDescriptors[i] = new TemplateValueDescriptorRenderComponent({ ref: parsePart.state.tag_ref })
					continue
				}
			} else if (parsePart.state.type > HtmlParseStateType.ATTR_VALUE_START && parsePart.state.type < HtmlParseStateType.ATTR_VALUE_END) {
				const attributeNameParts = parsePart.state.attribute_name.split(":")
				const quote =
					parsePart.state.type === HtmlParseStateType.AttributeValueUnquoted
						? ""
						: parsePart.state.type === HtmlParseStateType.AttributeValueSingleQuoted
						? "'"
						: '"'
				if (attributeNameParts.length === 2) {
					if (parsePart.state.type !== HtmlParseStateType.AttributeValueUnquoted) throw new Error("Directive value must be unquoted")
					html += `""`
					const type = attributeNameParts[0]!
					const name = attributeNameParts[1]!
					if (!isTemplateValueDirectiveType(type)) throw new Error(`Unknown directive type "${type}".`)
					valueDescriptors[i] = new TemplateValueDescriptorDirective({
						ref: parsePart.state.tag_ref,
						type,
						name,
					})
					continue
				} else {
					const name = attributeNameParts[0]!
					if (quote === "") html += `""`
					else {
						html += parsePart.state.tag_ref // using the tag ref as a separator or placeholder for the value
						const attributeMap =
							refAttributes.get(parsePart.state.tag_ref) ??
							refAttributes.set(parsePart.state.tag_ref, new Map()).get(parsePart.state.tag_ref)!
						const attributePartArray = attributeMap.get(name) ?? attributeMap.set(name, []).get(name)!
						attributePartArray.push(i)
					}
					valueDescriptors[i] = new TemplateValueDescriptorAttribute({
						ref: parsePart.state.tag_ref,
						name,
						quote,
					})
					continue
				}
			}

			throw new Error(`Unexpected value`)
		}

		const template = document.createElement("template")
		template.innerHTML = html

		for (let index = 0; index < valueDescriptors.length; index++) {
			const descriptor = valueDescriptors[index]!

			if (descriptor instanceof TemplateValueDescriptorRenderNode) {
				const outlet = template.content.querySelector(`[\\:ref="${descriptor.ref}"]`)
				if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
			} else if (descriptor instanceof TemplateValueDescriptorRenderComponent) {
				const outlet = template.content.querySelector(`[\\:ref="${descriptor.ref}"]`)
				if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
			} else if (descriptor instanceof TemplateValueDescriptorAttribute) {
				const element = template.content.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
				if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
			} else if (descriptor instanceof TemplateValueDescriptorDirective) {
				const element = template.content.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
				if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
				switch (descriptor.type) {
					case "class":
						break
					case "style":
						break
					case "on":
						break
					case "ref":
						break
					case "bind":
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
						break
					default:
						unhandled("Unhanded directive type", descriptor.type)
				}
			}
		}

		for (const [ref, attributes] of refAttributes) {
			const element = template.content.querySelector(`[\\:ref="${ref}"]`) as HTMLElement
			if (!element) throw new Error(`Could not find element with ref "${ref}".`)
			multiValueAttributes.set(ref, new Map())

			for (const [name, indexMap] of attributes) {
				const attributeTemplateString = element.getAttribute(name)
				if (!attributeTemplateString) throw new Error(`Could not find attribute "${name}" on element with ref "${ref}".`)
				const attributeTemplate = attributeTemplateString
					.split(ref)
					.filter((s) => s)
					.flatMap((part, index) => {
						const valueIndex = indexMap[index]
						if (valueIndex === undefined)
							throw new Error(`Could not find value index of ${index}th part of attribute "${name}" on element with ref "${ref}".`)
						return [part, new ValueIndex(valueIndex)]
					})
				multiValueAttributes.get(ref)!.set(name, attributeTemplate)
			}
		}

		return {
			template,
			valueDescriptors,
			multiValueAttributes,
		}
	} catch (error) {
		if (error instanceof Error) throw new Error(`Error while parsing template: ${error.message}. \nAt:\n${html.slice(-256).trim()}`)
		throw new Error(`Unknown error while parsing template. \nAt:\n${html.slice(-256).trim()}`)
	}
}
