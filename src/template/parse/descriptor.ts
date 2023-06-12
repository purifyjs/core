import { assert } from "../../utils/assert.js"
import { uniqueId } from "../../utils/id.js"
import type { HtmlDescriptor } from "./html.js"
import { HtmlPartStateType } from "./html.js"

type ValueDescriptorType = "render-node" | "render-element" | "attribute" | "directive"
export function checkValueDescriptorType<T extends ValueDescriptorType>(type: T, descriptor: ValueDescriptor): descriptor is ValueDescriptor<T> {
	return descriptor.type === type
}

type DirectiveType = (typeof directiveTypes)[number]
const directiveTypes = ["class", "style", "on", "bind", "ref"] as const
const directiveTypesSet = new Set(directiveTypes)
function isDirectiveType(value: string): value is DirectiveType {
	return directiveTypesSet.has(value as DirectiveType)
}

type ValueDescriptor<T extends ValueDescriptorType = ValueDescriptorType> = {
	type: T
	ref: string
} & (T extends "attribute"
	? {
			name: string
			quote: "'" | '"' | ""
	  }
	: T extends "directive"
	? {
			directive: DirectiveType
			name: string
	  }
	: {})

function createValueDescriptor<T extends ValueDescriptorType>(type: T, descriptor: Omit<ValueDescriptor<T>, "type">) {
	assert<ValueDescriptor<T>>(descriptor)
	descriptor.type = type
	return descriptor
}

type RefData = {
	attributes: Map<string, AttributeData>
}

type AttributeData = {
	indexes: number[]
	parts: (number | string)[] | null
}

export type TemplateDescriptor = {
	html: string
	valueDescriptors: ValueDescriptor[]
	refDataMap: Map<string, RefData>
}

export function parseTemplateDescriptor<T extends HtmlDescriptor>(htmlParse: T): TemplateDescriptor {
	let html = ""

	try {
		const refDataMap: TemplateDescriptor["refDataMap"] = new Map()
		const valueDescriptors: TemplateDescriptor["valueDescriptors"] = new Array(Math.max(0, htmlParse.parts.length - 1))

		for (let i = 0; i < htmlParse.parts.length; i++) {
			const parsePart = htmlParse.parts[i]!
			html += parsePart.html

			let refData = refDataMap.get(parsePart.state.ref)
			if (!refData) refDataMap.set(parsePart.state.ref, (refData = { attributes: new Map() }))

			if (!(i < valueDescriptors.length)) break

			if (parsePart.state.type === HtmlPartStateType.Outer) {
				const ref = uniqueId()
				html += `<x ref:${ref}></x>`
				valueDescriptors[i] = createValueDescriptor("render-node", { ref })
				continue
			} else if (parsePart.state.type === HtmlPartStateType.TagInner && !parsePart.state.attributeName) {
				if (parsePart.state.tag === "x") {
					const ref = parsePart.state.ref
					valueDescriptors[i] = createValueDescriptor("render-element", { ref })
					continue
				}
			} else if (parsePart.state.type > HtmlPartStateType.ATTR_VALUE_START && parsePart.state.type < HtmlPartStateType.ATTR_VALUE_END) {
				const attributeNameParts = parsePart.state.attributeName.split(":")
				const quote =
					parsePart.state.type === HtmlPartStateType.AttributeValueUnquoted
						? ""
						: parsePart.state.type === HtmlPartStateType.AttributeValueSingleQuoted
						? "'"
						: '"'
				if (attributeNameParts.length === 2) {
					if (parsePart.state.type !== HtmlPartStateType.AttributeValueUnquoted) throw new Error("Directive value must be unquoted")
					html += `""`
					const ref = parsePart.state.ref
					const type = attributeNameParts[0]!
					const name = attributeNameParts[1]!
					if (!isDirectiveType(type)) throw new Error(`Unknown directive type "${type}".`)
					valueDescriptors[i] = createValueDescriptor("directive", { ref, name, directive: type })
					continue
				} else {
					const ref = parsePart.state.ref
					const name = attributeNameParts[0]!
					if (quote === "") html += `""`
					else {
						html += ref // using the tag ref as a separator or placeholder for the value
						let attributeData = refData.attributes.get(name)
						if (!attributeData) refData.attributes.set(name, (attributeData = { indexes: [], parts: null }))
						attributeData.indexes.push(i)
					}
					valueDescriptors[i] = createValueDescriptor("attribute", { name, quote, ref })
					continue
				}
			}

			throw new Error(`Unexpected value`)
		}

		return {
			valueDescriptors,
			refDataMap,
			html,
		}
	} catch (error) {
		console.error("Error while parsing template:", error, "At:", html.slice(-256).trim())
		throw error
	}
}
