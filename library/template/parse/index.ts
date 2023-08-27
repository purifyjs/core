import { createTemplateShape } from "./shape"
import { createTemplateFromShape } from "./template"
import { tokenizeTemplate } from "./tokenizer"

export namespace parse {
	export const template = createTemplateFromShape
	export const shape = createTemplateShape
	export const tokenize = tokenizeTemplate
}
