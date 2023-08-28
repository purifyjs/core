import { SignalReadable, SignalWritable } from "../signal"

export type TemplateValue =
	| string
	| number
	| boolean
	| Node
	| Function
	| EventListener
	| SignalReadable<TemplateValue>
	| SignalWritable<TemplateValue | Date>
	| null
	| TemplateValue[]
export type Template = {
	strings: TemplateStringsArray
	values: TemplateValue[]
}
