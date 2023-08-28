import { createTemplateShape } from "./shape"
import { tokenizeTemplate } from "./tokenizer"

export namespace parse {
	export const shape = createTemplateShape
	export const tokenize = tokenizeTemplate
}
