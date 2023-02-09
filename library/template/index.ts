import { ComponentBase } from "../component"
import { asMountableNode, makeMountableNode } from "../mountable"
import { createDerive, createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derivable"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { assert } from "../utils/assert"
import { nameOf, typeOf } from "../utils/name"
import { valueToNode } from "./node"
import { parseTemplateDescriptor, TemplateDescriptor, TemplateValueDescriptorType, ValueIndex } from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"

export type TemplateValue = string | number | boolean | Node | SignalReadable<any> | SignalDeriver<any> | Function | TemplateValue[]
export interface Template {
	strings: TemplateStringsArray
	values: TemplateValue[]
}

export const EMPTY_NODE = document.createDocumentFragment()

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T) {
	return render(parseTemplateDescriptor(parseTemplateHtml(strings)), values)
}

export function template<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T) {
	return { strings, values }
}

export function render<T extends TemplateValue[]>(templateDescriptor: TemplateDescriptor, values: T): Node[] {
	const fragment = templateDescriptor.template.content.cloneNode(true) as DocumentFragment

	try {
		for (let index = 0; index < values.length; index++) {
			const descriptor = templateDescriptor.valueDescriptors[index]!
			let value = values[index]

			switch (descriptor.type) {
				case TemplateValueDescriptorType.RenderNode:
					{
						const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)
						if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
						outlet.replaceWith(valueToNode(value))
					}
					break
				case TemplateValueDescriptorType.RenderComponent:
					{
						if (!(value instanceof ComponentBase))
							throw new Error(`Expected ${nameOf(ComponentBase)} at index "${index}", but got ${nameOf(value)}.`)
						const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)
						if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
						value.append(...Array.from(outlet.childNodes))
						outlet.removeAttribute(":outlet")
						for (const attribute of Array.from(outlet.attributes)) value.setAttribute(attribute.name, attribute.value)
						outlet.replaceWith(value)
					}
					break
				case TemplateValueDescriptorType.Attribute:
					{
						const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
						if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
						if (value instanceof Function) values[index] = value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
						if (value instanceof SignalReadable) {
							if (descriptor.quote === "") {
								makeMountableNode(element)
								element.$subscribe(value, (value) => element.setAttribute(descriptor.attribute.name, `${value}`), {
									mode: "immediate",
								})
							} else {
								// Handled at the end. Because this attribute can have multiple values.
							}
						} else {
							if (descriptor.quote === "") element.setAttribute(descriptor.attribute.name, `${value}`)
							else {
								// Handled at the end. Because this attribute can have multiple values.
							}
						}
					}
					break
				case TemplateValueDescriptorType.Directive: {
					const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
					if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
					switch (descriptor.attribute.type) {
						case "class":
							if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
							if (value instanceof SignalReadable)
								asMountableNode(element).$subscribe(value, (v) => element.classList.toggle(descriptor.attribute.name, !!v), {
									mode: "immediate",
								})
							else element.classList.toggle(descriptor.attribute.name, !!value)
							break
						case "style":
							if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
							if (value instanceof SignalReadable)
								asMountableNode(element).$subscribe(value, (v) => element.style.setProperty(descriptor.attribute.name, `${v}`), {
									mode: "immediate",
								})
							else element.style.setProperty(descriptor.attribute.name, `${value}`)
							break
						case "on":
							if (!(value instanceof Function))
								throw new Error(
									`${descriptor.attribute.type}:${descriptor.attribute.name} must be a function, but got ${nameOf(value)}.`
								)
							makeMountableNode(element)
							element.$onMount(() => element.addEventListener(descriptor.attribute.name, value as EventListener))
							element.$onUnmount(() => element.removeEventListener(descriptor.attribute.name, value as EventListener))
							break
						case "ref":
							if (!(value instanceof SignalWritable))
								throw new Error(
									`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(
										value
									)}.`
								)
							value.set(element)
							break
						case "bind":
							if (!(value instanceof SignalWritable))
								throw new Error(
									`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(
										value
									)}.`
								)
							const signal = value
							switch (descriptor.attribute.name) {
								case "value:string":
									assert<HTMLInputElement>(element)
									{
										const listener = () => (signal.value = element.value)
										makeMountableNode(element)
										element.$onMount(() => element.addEventListener("input", listener))
										element.$onUnmount(() => element.removeEventListener("input", listener))
										element.$subscribe(signal, (value) => (element.value = `${value}`), { mode: "immediate" })
									}
									break
								case "value:number":
									assert<HTMLInputElement>(element)
									{
										const listener = () => (signal.value = element.valueAsNumber)
										makeMountableNode(element)
										element.$onMount(() => element.addEventListener("input", listener))
										element.$onUnmount(() => element.removeEventListener("input", listener))
										element.$subscribe(signal, (value) => (element.valueAsNumber = value), { mode: "immediate" })
									}
									break
								case "value:date":
									assert<HTMLInputElement>(element)
									{
										const listener = () => (signal.value = element.valueAsDate)
										makeMountableNode(element)
										element.$onMount(() => element.addEventListener("input", listener))
										element.$onUnmount(() => element.removeEventListener("input", listener))
										element.$subscribe(signal, (value) => (element.valueAsDate = value), { mode: "immediate" })
									}
									break
								case "value:boolean":
									assert<HTMLInputElement>(element)
									{
										const listener = () => (signal.value = element.checked)
										makeMountableNode(element)
										element.$onMount(() => element.addEventListener("input", listener))
										element.$onUnmount(() => element.removeEventListener("input", listener))
										element.$subscribe(signal, (value) => (element.checked = value), { mode: "immediate" })
									}
									break
								default:
									throw new Error(`Unknown binding key ${descriptor.attribute.name}.`)
							}
							break
						default:
							throw new Error(`Unknown descriptor type "${descriptor.attribute.type}".`)
					}
				}
			}
		}

		for (const [ref, attributes] of templateDescriptor.multiValueAttributes) {
			const element = fragment.querySelector(`[\\:ref="${ref}"]`) as HTMLElement
			if (!element) throw new Error(`While rendering attribute parts: Could not find element with ref "${ref}".`)

			for (const [name, parts] of attributes) {
				makeMountableNode(element)
				const signal = createDerive((s) =>
					parts
						.map((part) => {
							const value = part instanceof ValueIndex ? values[part.index] : part
							return value instanceof SignalReadable ? s(value).value : value
						})
						.join("")
				)
				element.$subscribe(signal, (value) => element.setAttribute(name, value), {
					mode: "immediate",
				})
			}
		}
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Values:`, values)
			throw new Error(`Error while rendering template: ${error.message}.\nHtml:\n${templateDescriptor.template.innerHTML.trim()}`)
		}
	}

	return Array.from(fragment.childNodes)
}
