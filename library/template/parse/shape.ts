import { uniqueId } from "../../utils/id"
import { unhandled } from "../../utils/unhandled"
import { TemplateToken } from "./tokenizer"

export type TemplateShape = {
	html: string
	items: TemplateShape.Item[]
	refDatas: Map<string, TemplateShape.RefData>
}
export namespace TemplateShape {
	export type RefData = {
		tagName: TemplateToken["state"]["tag"]
		attributes: TemplateToken["state"]["attributes"]
		attributeValues: Map<string, AttributeValueData>
	}

	export type AttributeValueData = {
		valueIndexes: number[]
		parts: (number | string)[] | null
	}

	export type Item = Attribute | Directive | RenderElement | RenderNode
	export type Attribute = {
		itemType: "attr"
		name: string
		quote: "'" | '"' | ""
		ref: string
	}
	export type Directive = {
		itemType: "dir"
		directiveType: Directive.Type
		name: string
		ref: string
	}
	export namespace Directive {
		export type Type = (typeof types)[number]
		export const types = ["class", "style", "on", "ref", "bind"] as const
		const typesSet = new Set(types)
		export function getType(type: string): Type | null {
			if (typesSet.has(type as any)) return type as Type
			return null
		}
	}
	export type RenderElement = {
		itemType: "el"
		ref: string
	}
	export type RenderNode = {
		itemType: "node"
		ref: string
	}
}

export function createTemplateShape(tokens: TemplateToken[]): TemplateShape {
	let html = ""

	try {
		const refDatas: TemplateShape["refDatas"] = new Map()
		const items: TemplateShape["items"] = new Array(Math.max(0, tokens.length - 1))

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]!
			html += token.html

			let refData = refDatas.get(token.state.ref)
			if (!refData)
				refDatas.set(token.state.ref, (refData = { attributeValues: new Map(), attributes: token.state.attributes, tagName: token.state.tag }))

			if (!(i < items.length)) break

			if (token.state.type === TemplateToken.State.Type.Outer) {
				const ref = uniqueId()
				html += `<x ref:${ref}></x>`
				items[i] = {
					itemType: "node",
					ref,
				}
				continue
			} else if (token.state.type === TemplateToken.State.Type.TagInner && !token.state.currentAttribute.name) {
				if (token.state.tag === "x") {
					const ref = token.state.ref
					items[i] = {
						itemType: "el",
						ref,
					}
					continue
				}
			} else if (token.state.type > TemplateToken.State.Type.ATTR_VALUE_START && token.state.type < TemplateToken.State.Type.ATTR_VALUE_END) {
				const attributeNameParts = token.state.currentAttribute.name.split(":")
				const quote =
					token.state.type === TemplateToken.State.Type.AttributeValueUnquoted
						? ""
						: token.state.type === TemplateToken.State.Type.AttributeValueSingleQuoted
						? "'"
						: '"'
				if (attributeNameParts.length === 2) {
					if (quote !== "") throw new Error("Directive value must be unquoted")
					html += `""`
					const ref = token.state.ref
					const type = attributeNameParts[0]!
					const name = attributeNameParts[1]!
					const directiveType = TemplateShape.Directive.getType(type)
					if (!directiveType) throw new Error(`Unknown directive type "${type}".`)
					items[i] = {
						itemType: "dir",
						directiveType,
						name,
						ref,
					}
					continue
				} else {
					const ref = token.state.ref
					const name = attributeNameParts[0]!
					if (quote === "") html += `""`
					else {
						html += ref // using the tag ref as a separator or placeholder for the value
						let attributeValueData = refData.attributeValues.get(name)
						if (!attributeValueData) refData.attributeValues.set(name, (attributeValueData = { valueIndexes: [], parts: null }))
						attributeValueData.valueIndexes.push(i)
					}
					items[i] = {
						itemType: "attr",
						name,
						quote,
						ref,
					}
					continue
				}
			}

			throw new Error(`Unexpected value`)
		}

		const self: TemplateShape = {
			items: items,
			refDatas: refDatas,
			html,
		}
		validate(self)
		return self
	} catch (error) {
		console.error("Error while parsing template:", error, "At:", html.slice(-256).trim())
		throw error
	}
}

export function validate(shape: TemplateShape): void {
	try {
		for (let index = 0; index < shape.items.length; index++) {
			const item = shape.items[index]!
			const refData = shape.refDatas.get(item.ref)!

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
								if (refData.tagName === "input") {
									switch (refData.attributes["type"]) {
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
								} else if (refData.tagName === "textarea" || refData.tagName === "select") {
									item.name = "value:string"
									break
								}

								throw new Error(`${refData.tagName} does not support binding to ${item.name}`)
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

		for (const [ref, { attributeValues, attributes, tagName }] of shape.refDatas) {
			for (const [name, attributeValue] of attributeValues) {
				const attributeTemplateString = attributes[name]
				if (!attributeTemplateString) throw new Error(`Could not find attribute "${name}" on element with ref "${ref}".`)
				attributeValue.parts = attributeTemplateString
					.split(ref)
					.filter((s) => s)
					.flatMap((part, index) => {
						const valueIndex = attributeValue.valueIndexes[index]
						if (valueIndex === undefined)
							throw new Error(`Could not find value index of ${index}th part of attribute "${name}" on element with ref "${ref}".`)
						return [part, valueIndex]
					})
			}
		}
	} catch (error) {
		console.error("Error while parsing template:", error, "At:", shape.html.slice(-256).trim())
		throw error
	}
}
