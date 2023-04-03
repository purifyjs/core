import type { SignalReadable } from "../signal/readable"
import type { Renderable } from "./renderable"

export { html } from "./html"
export { css } from "./css"

export type TemplateValue =
	| string
	| number
	| boolean
	| Node
	| SignalReadable<any>
	| { (...params: any[]): unknown }
	| Renderable
	| null
	| TemplateValue[]
export type Template = {
	strings: TemplateStringsArray
	values: TemplateValue[]
}
