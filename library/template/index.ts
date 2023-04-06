import type { Renderable } from "./renderable"

export { css } from "./css"
export { html } from "./html"

export type TemplateValue = string | number | boolean | Node | Function | EventListener | Renderable | null | TemplateValue[]
export type Template = {
	strings: TemplateStringsArray
	values: TemplateValue[]
}
