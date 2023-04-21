import { randomId } from "../../utils/id"

export type HtmlDescriptor = {
	parts: HtmlPart[]
}

type HtmlPart = {
	html: string
	state: HtmlPartState
}

type HtmlPartState = {
	type: HtmlPartStateType
	tag: string
	ref: string
	attributeName: string
	attributeValue: string
	addRef: boolean
}

export const enum HtmlPartStateType {
	Outer,

	TAG_START,
	TagInner,
	TagName,
	TagClose,
	TAG_END,

	ATTR_START,
	AttributeName,
	ATTR_VALUE_START,
	AttributeValueUnquoted,

	ATTR_VALUE_QUOTED_START,
	AttributeValueSingleQuoted,
	AttributeValueDoubleQuoted,
	ATTR_VALUE_QUOTED_END,
	ATTR_VALUE_END,
	ATTR_END,
}

export function parseTemplateHtml(templateStrings: TemplateStringsArray): HtmlDescriptor {
	const parses: HtmlPart[] = new Array(templateStrings.length)

	const state: HtmlPartState = {
		type: HtmlPartStateType.Outer,
		tag: "",
		ref: "",
		attributeName: "",
		attributeValue: "",
		addRef: false,
	}

	for (let i = 0; i < templateStrings.length; i++) {
		const templateString = templateStrings[i]!
		let resultHtml = ""

		state.addRef = true
		for (let i = 0; i < templateString.length; i++) {
			const char = templateString[i]!
			try {
				resultHtml += processChar(char, state)
			} catch (error) {
				console.error("Error while parsing template:", error, "At:", resultHtml.slice(-256).trim())
				throw error
			}
		}

		parses[i] = {
			html: resultHtml,
			state: { ...state },
		}
	}
	return {
		parts: parses,
	}
}

function processChar(char: string, state: HtmlPartState): string {
	let result = char
	switch (state.type) {
		case HtmlPartStateType.Outer:
			if (char === "<") {
				state.type = HtmlPartStateType.TagName
				state.tag = ""
				state.ref = randomId()
				state.attributeName = ""
				state.attributeValue = ""
				state.addRef = false
			}
			break
		case HtmlPartStateType.TagName:
			if (state.tag === "" && char === "/") {
				state.type = HtmlPartStateType.TagClose
				state.tag = ""
			} else if (char === ">") {
				state.type = HtmlPartStateType.Outer
			} else if (/\s/.test(char)) {
				state.type = HtmlPartStateType.TagInner
			} else state.tag += char
			break
		case HtmlPartStateType.TagInner:
			if (char === ">") {
				state.type = HtmlPartStateType.Outer
				if (state.addRef) result = ` ref:${state.ref}>`
			} else if (/\s/.test(char)) state.type = HtmlPartStateType.TagInner
			else {
				state.type = HtmlPartStateType.AttributeName
				state.attributeName = char
			}
			break
		case HtmlPartStateType.TagClose:
			if (char === ">") {
				state.type = HtmlPartStateType.Outer
			} else state.tag += char
			break
		case HtmlPartStateType.AttributeName:
			if (char === ">") {
				state.type = HtmlPartStateType.TagInner
				return processChar(char, state)
			} else if (/\s/.test(char)) state.type = HtmlPartStateType.TagInner
			else if (char === "=") {
				state.type = HtmlPartStateType.AttributeValueUnquoted
				state.attributeValue = ""
			} else state.attributeName += char
			break
		case HtmlPartStateType.AttributeValueUnquoted:
			if (char === ">") {
				state.type = HtmlPartStateType.TagInner
				return processChar(char, state)
			} else if (/\s/.test(char)) state.type = HtmlPartStateType.TagInner
			else if (char === '"') {
				state.type = HtmlPartStateType.AttributeValueDoubleQuoted
				state.attributeValue = ""
			} else if (char === "'") {
				state.type = HtmlPartStateType.AttributeValueSingleQuoted
				state.attributeValue = ""
			} else {
				throw new Error(`Unexpected character '${char}' in attribute value`)
				// state.attribute_value += char
				// Not needed, causes complexity in parsing.
			}
			break
		case HtmlPartStateType.AttributeValueSingleQuoted:
			if (char === "'") state.type = HtmlPartStateType.TagInner
			else state.attributeValue += char
			break
		case HtmlPartStateType.AttributeValueDoubleQuoted:
			if (char === '"') state.type = HtmlPartStateType.TagInner
			else state.attributeValue += char
			break
	}

	return result.trim()
}
