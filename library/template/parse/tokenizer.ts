import { uniqueId } from "../../utils/id"

export namespace TemplateTokenizer {
	export type Token = {
		html: string
		state: TemplateTokenizer.State
	}
	export type State = {
		type: State.Type
		tag: string
		ref: string
		attributeName: string
		attributeValue: string
		addRef: boolean
	}
	export namespace State {
		export const enum Type {
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
	}

	export function tokenize(templateStrings: TemplateStringsArray): Token[] {
		const tokens: Token[] = new Array(templateStrings.length)

		const state: TemplateTokenizer.State = {
			type: State.Type.Outer,
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

			tokens[i] = {
				html: resultHtml,
				state: { ...state },
			}
		}
		return tokens
	}

	function processChar(char: string, state: State): string {
		let result = char
		switch (state.type) {
			case State.Type.Outer:
				if (char === "<") {
					state.type = State.Type.TagName
					state.tag = ""
					state.ref = uniqueId()
					state.attributeName = ""
					state.attributeValue = ""
					state.addRef = false
				}
				break
			case State.Type.TagName:
				if (state.tag === "" && char === "/") {
					state.type = State.Type.TagClose
					state.tag = ""
				} else if (char === ">") {
					state.type = State.Type.Outer
				} else if (/\s/.test(char)) {
					state.type = State.Type.TagInner
				} else state.tag += char
				break
			case State.Type.TagInner:
				if (char === ">") {
					state.type = State.Type.Outer
					if (state.addRef) result = ` ref:${state.ref}>`
				} else if (/\s/.test(char)) state.type = State.Type.TagInner
				else {
					state.type = State.Type.AttributeName
					state.attributeName = char
				}
				break
			case State.Type.TagClose:
				if (char === ">") {
					state.type = State.Type.Outer
				} else state.tag += char
				break
			case State.Type.AttributeName:
				if (char === ">") {
					state.type = State.Type.TagInner
					return processChar(char, state)
				} else if (/\s/.test(char)) state.type = State.Type.TagInner
				else if (char === "=") {
					state.type = State.Type.AttributeValueUnquoted
					state.attributeValue = ""
				} else state.attributeName += char
				break
			case State.Type.AttributeValueUnquoted:
				if (char === ">") {
					state.type = State.Type.TagInner
					return processChar(char, state)
				} else if (/\s/.test(char)) state.type = State.Type.TagInner
				else if (char === '"') {
					state.type = State.Type.AttributeValueDoubleQuoted
					state.attributeValue = ""
				} else if (char === "'") {
					state.type = State.Type.AttributeValueSingleQuoted
					state.attributeValue = ""
				} else {
					throw new Error(`Unexpected character '${char}' in attribute value`)
					// state.attribute_value += char
					// Not needed, causes complexity in parsing.
				}
				break
			case State.Type.AttributeValueSingleQuoted:
				if (char === "'") state.type = State.Type.TagInner
				else state.attributeValue += char
				break
			case State.Type.AttributeValueDoubleQuoted:
				if (char === '"') state.type = State.Type.TagInner
				else state.attributeValue += char
				break
		}

		return result
	}
}
