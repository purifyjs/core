import { SignalReadable, SignalWritable } from "../signal"
import type { Renderable } from "./renderable"

export type TemplateValue =
	| string
	| number
	| boolean
	| Node
	| Function
	| EventListener
	| SignalReadable<TemplateValue>
	| SignalWritable<TemplateValue | Date>
	| Renderable<TemplateValue>
	| null
	| TemplateValue[]
export type Template = {
	strings: TemplateStringsArray
	values: TemplateValue[]
}
