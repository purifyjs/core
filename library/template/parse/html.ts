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
	tag_ref: string
	attribute_name: string
	attribute_value: string
}

/*
Not being compiled to literal for some reason
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
} */
export type HtmlParseStateType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
export const HTML_PARSE_STATE_OUTER = 0

export const HTML_PARSE_STATE_TAG_START = 1
export const HTML_PARSE_STATE_TAG_INNER = 2
export const HTML_PARSE_STATE_TAG_NAME = 3
export const HTML_PARSE_STATE_TAG_CLOSE = 4
export const HTML_PARSE_STATE_TAG_END = 5

export const HTML_PARSE_STATE_ATTR_START = 6
export const HTML_PARSE_STATE_ATTR_NAME = 7
export const HTML_PARSE_STATE_ATTR_VALUE_START = 8
export const HTML_PARSE_STATE_ATTR_VALUE_UNQUOTED = 9

export const HTML_PARSE_STATE_ATTR_VALUE_QUOTED_START = 10
export const HTML_PARSE_STATE_ATTR_VALUE_SINGLE_QUOTED = 11
export const HTML_PARSE_STATE_ATTR_VALUE_DOUBLE_QUOTED = 12
export const HTML_PARSE_STATE_ATTR_VALUE_QUOTED_END = 13
export const HTML_PARSE_STATE_ATTR_VALUE_END = 14
export const HTML_PARSE_STATE_ATTR_END = 15

export function parseTemplateHtml(arr: TemplateStringsArray): TemplateHtmlParse {
	const parses: TemplateHtmlParsePart[] = []

	const state: HtmlParseState = {
		type: HTML_PARSE_STATE_OUTER,
		tag: "",
		tag_ref: "",
		attribute_name: "",
		attribute_value: "",
	}

	for (let i = 0; i < arr.length; i++) {
		const parse = arr[i]!
		let html = ""

		for (let i = 0; i < parse.length; i++) {
			const char = parse[i]!
			try {
				html = processChar(char, html, state)
			} catch (error) {
				console.error("Error while parsing template:", error, "At:", html.slice(-256).trim())
				throw error
			}
		}

		parses.push({
			html,
			state: { ...state },
		})
	}
	return {
		parts: parses,
	}
}

function processChar(char: string, html: string, state: HtmlParseState) {
	switch (state.type) {
		case HTML_PARSE_STATE_OUTER:
			if (char === "<") {
				state.type = HTML_PARSE_STATE_TAG_NAME
				state.tag = ""
				state.tag_ref = randomId()
				state.attribute_name = ""
				state.attribute_value = ""
			} else if (/\s/.test(html[html.length - 1]!) && /\s/.test(char)) return html
			break
		case HTML_PARSE_STATE_TAG_NAME:
			if (state.tag === "" && char === "/") {
				state.type = HTML_PARSE_STATE_TAG_CLOSE
				state.tag = ""
			} else if (char === ">") {
				state.type = HTML_PARSE_STATE_OUTER
				/* html += ` :ref="${ref}"` */
			} else if (/\s/.test(char)) {
				state.type = HTML_PARSE_STATE_TAG_INNER
				html += ` :ref="${state.tag_ref}"`
			} else state.tag += char
			break
		case HTML_PARSE_STATE_TAG_INNER:
			if (char === ">") state.type = HTML_PARSE_STATE_OUTER
			else if (/\s/.test(char)) state.type = HTML_PARSE_STATE_TAG_INNER
			else {
				state.type = HTML_PARSE_STATE_ATTR_NAME
				state.attribute_name = char
			}
			break
		case HTML_PARSE_STATE_TAG_CLOSE:
			if (char === ">") {
				state.type = HTML_PARSE_STATE_OUTER
				state.tag = ""
			} else state.tag += char
			break
		case HTML_PARSE_STATE_ATTR_NAME:
			if (char === ">") state.type = HTML_PARSE_STATE_OUTER
			else if (/\s/.test(char)) state.type = HTML_PARSE_STATE_TAG_INNER
			else if (char === "=") {
				state.type = HTML_PARSE_STATE_ATTR_VALUE_UNQUOTED
				state.attribute_value = ""
			} else state.attribute_name += char
			break
		case HTML_PARSE_STATE_ATTR_VALUE_UNQUOTED:
			if (char === ">") state.type = HTML_PARSE_STATE_OUTER
			else if (/\s/.test(char)) state.type = HTML_PARSE_STATE_TAG_INNER
			else if (char === '"') {
				state.type = HTML_PARSE_STATE_ATTR_VALUE_DOUBLE_QUOTED
				state.attribute_value = ""
			} else if (char === "'") {
				state.type = HTML_PARSE_STATE_ATTR_VALUE_SINGLE_QUOTED
				state.attribute_value = ""
			} else {
				throw new Error(`Unexpected character '${char}' in attribute value`)
				// state.attribute_value += char Not needed, causes complexity in parsing. Might be fixed later.
			}
			break
		case HTML_PARSE_STATE_ATTR_VALUE_SINGLE_QUOTED:
			if (char === "'") state.type = HTML_PARSE_STATE_TAG_INNER
			else state.attribute_value += char
			break
		case HTML_PARSE_STATE_ATTR_VALUE_DOUBLE_QUOTED:
			if (char === '"') state.type = HTML_PARSE_STATE_TAG_INNER
			else state.attribute_value += char
			break
	}

	return `${html}${char}`
}
