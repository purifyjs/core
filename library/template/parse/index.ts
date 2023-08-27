import { TemplateShape } from "./shape"
import { createTemplateFromShape } from "./template"
import { TemplateTokenizer } from "./tokenizer"

export namespace parse {
	export const template = createTemplateFromShape
	/**
	 * @deprecated Use `shape` instead. Backwards compatibility for Vite plugin.
	 */
	export const descriptor = TemplateShape.parse
	export const shape = TemplateShape.parse
	/**
	 * @deprecated Use `tokenize` instead. Backwards compatibility for Vite plugin.
	 */
	export const html = TemplateTokenizer.tokenize
	export const tokenize = TemplateTokenizer.tokenize
}
