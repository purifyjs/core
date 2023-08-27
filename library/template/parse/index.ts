import { createTemplateShape } from "./shape"
import { createTemplateFromShape } from "./template"
import { tokenizeTemplate } from "./tokenizer"

export namespace parse {
	export const template = createTemplateFromShape
	/**
	 * @deprecated Use `shape` instead. Backwards compatibility for Vite plugin.
	 */
	export const descriptor = createTemplateShape
	export const shape = createTemplateShape
	/**
	 * @deprecated Use `tokenize` instead. Backwards compatibility for Vite plugin.
	 */
	export const html = tokenizeTemplate
	export const tokenize = tokenizeTemplate
}
