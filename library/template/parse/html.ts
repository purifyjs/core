import { randomId } from "../../utils/id"

export type TemplateHtmlParse = {
	parts: TemplateHtmlParsePart[]
}

export type TemplateHtmlParsePart = {
	html: string
	state: HtmlParseState
}

export type HtmlParseState = {
	type: HtmlParseStateType
	tag: string
	ref: string
	attributeName: string
	attributeValue: string
}

export const enum HtmlParseStateType {
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

export function parseTemplateHtml(arr: TemplateStringsArray): TemplateHtmlParse {
	const parses: TemplateHtmlParsePart[] = new Array(arr.length)

	const state: HtmlParseState = {
		type: HtmlParseStateType.Outer,
		tag: "",
		ref: "",
		attributeName: "",
		attributeValue: "",
	}

	for (let i = 0; i < arr.length; i++) {
		const parse = arr[i]!
		let html = ""

		for (let i = 0; i < parse.length; i++) {
			const char = parse[i]!
			try {
				html += processChar(char, state)
			} catch (error) {
				console.error("Error while parsing template:", error, "At:", html.slice(-256).trim())
				throw error
			}
		}

		parses[i] = {
			html,
			state: { ...state },
		}
	}
	return {
		parts: parses,
	}
}

function processChar(char: string, state: HtmlParseState) {
	let result = char
	switch (state.type) {
		case HtmlParseStateType.Outer:
			if (char === "<") {
				state.type = HtmlParseStateType.TagName
				state.tag = ""
				state.ref = randomId()
				state.attributeName = ""
				state.attributeValue = ""
			}
			break
		case HtmlParseStateType.TagName:
			if (state.tag === "" && char === "/") {
				state.type = HtmlParseStateType.TagClose
				state.tag = ""
			} else if (char === ">") {
				state.type = HtmlParseStateType.Outer
			} else if (/\s/.test(char)) {
				state.type = HtmlParseStateType.TagInner
			} else state.tag += char
			break
		case HtmlParseStateType.TagInner:
			if (char === ">") state.type = HtmlParseStateType.Outer
			else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
			else {
				state.type = HtmlParseStateType.AttributeName
				state.attributeName = char
				result = `ref:${state.ref} ${result}`
			}
			break
		case HtmlParseStateType.TagClose:
			if (char === ">") {
				state.type = HtmlParseStateType.Outer
				state.tag = ""
			} else state.tag += char
			break
		case HtmlParseStateType.AttributeName:
			if (char === ">") state.type = HtmlParseStateType.Outer
			else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
			else if (char === "=") {
				state.type = HtmlParseStateType.AttributeValueUnquoted
				state.attributeValue = ""
			} else state.attributeName += char
			break
		case HtmlParseStateType.AttributeValueUnquoted:
			if (char === ">") state.type = HtmlParseStateType.Outer
			else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
			else if (char === '"') {
				state.type = HtmlParseStateType.AttributeValueDoubleQuoted
				state.attributeValue = ""
			} else if (char === "'") {
				state.type = HtmlParseStateType.AttributeValueSingleQuoted
				state.attributeValue = ""
			} else {
				throw new Error(`Unexpected character '${char}' in attribute value`)
				// state.attribute_value += char
				// Not needed, causes complexity in parsing.
			}
			break
		case HtmlParseStateType.AttributeValueSingleQuoted:
			if (char === "'") state.type = HtmlParseStateType.TagInner
			else state.attributeValue += char
			break
		case HtmlParseStateType.AttributeValueDoubleQuoted:
			if (char === '"') state.type = HtmlParseStateType.TagInner
			else state.attributeValue += char
			break
	}

	return result
}
