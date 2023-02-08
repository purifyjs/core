import { randomId } from "../../utils/id"
import { HtmlParseStateType, TemplateHtmlParse } from "./html"

export interface TemplateDescriptor {
	template: HTMLTemplateElement
	valueDescriptors: TemplateValueDescriptor[]
	attributePartsMap: Map<string, Map<string, number[]>>
}

export const enum TemplateValueDescriptorType {
	RenderNode,
	RenderComponent,
	Attribute,
	Directive,
}

export interface TemplateValueDescriptor {
	type: TemplateValueDescriptorType
	ref: string
	attribute: {
		type: string
		name: string
	}
	quote: '"' | "'" | ""
}

export function parseTemplateDescriptor<T extends TemplateHtmlParse>(htmlParse: T): TemplateDescriptor {
	let html = ""

	try {
		const attributePartsMap: Map<string, Map<string, number[]>> = new Map()
		const valueDescriptors: TemplateValueDescriptor[] = new Array(htmlParse.parts.length - 1)

		for (let i = 0; i < htmlParse.parts.length; i++) {
			const parsePart = htmlParse.parts[i]!
			html += parsePart.html

			if (!(i < valueDescriptors.length)) break

			if (parsePart.state.type === HtmlParseStateType.Outer) {
				const ref = randomId()
				html += `<x :ref="${ref}"></x>`
				valueDescriptors[i] = {
					type: TemplateValueDescriptorType.RenderNode,
					ref,
					attribute: {
						type: "",
						name: "",
					},
					quote: "",
				}
				continue
			} else if (parsePart.state.type === HtmlParseStateType.TagInner && !parsePart.state.attribute_name) {
				if (parsePart.state.tag === "x") {
					valueDescriptors[i] = {
						type: TemplateValueDescriptorType.RenderComponent,
						ref: parsePart.state.tag_ref,
						attribute: {
							type: "",
							name: "",
						},
						quote: "",
					}
					continue
				}
			} else if (
				parsePart.state.type > HtmlParseStateType.ATTR_VALUE_START &&
				parsePart.state.type < HtmlParseStateType.ATTR_VALUE_END
			) {
				const attributeNameParts = parsePart.state.attribute_name.split(":")
				const quote =
					parsePart.state.type === HtmlParseStateType.AttributeValueUnquoted
						? ""
						: parsePart.state.type === HtmlParseStateType.AttributeValueSingleQuoted
						? "'"
						: '"'
				if (attributeNameParts.length === 2) {
					if (parsePart.state.type !== HtmlParseStateType.AttributeValueUnquoted)
						throw new Error("Directive value must be unquoted")
					html += `""`
					const type = attributeNameParts[0]!
					const name = attributeNameParts[1]!
					valueDescriptors[i] = {
						type: TemplateValueDescriptorType.Directive,
						ref: parsePart.state.tag_ref,
						attribute: {
							type,
							name,
						},
						quote,
					}
					continue
				} else {
					const name = attributeNameParts[0]!
					if (quote === "") html += `""`
					else {
						html += parsePart.state.tag_ref // using the tag ref as a separator or placeholder for the signal value
						const attributeMap =
							attributePartsMap.get(parsePart.state.tag_ref) ??
							attributePartsMap.set(parsePart.state.tag_ref, new Map()).get(parsePart.state.tag_ref)!
						const attributePartArray = attributeMap.get(name) ?? attributeMap.set(name, []).get(name)!
						attributePartArray.push(i)
					}
					valueDescriptors[i] = {
						type: TemplateValueDescriptorType.Attribute,
						ref: parsePart.state.tag_ref,
						attribute: {
							type: "",
							name,
						},
						quote,
					}
					continue
				}
			}

			throw new Error(`Unexpected value`)
		}

		const template = document.createElement("template")
		template.innerHTML = html

		return {
			template,
			valueDescriptors,
			attributePartsMap,
		}
	} catch (error) {
		if (error instanceof Error)
			throw new Error(`Error while parsing template: ${error.message}. \nAt:\n${html.slice(-256).trim()}`)
		throw new Error(`Unknown error while parsing template. \nAt:\n${html.slice(-256).trim()}`)
	}
}
