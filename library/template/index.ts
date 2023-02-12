import { ComponentElement } from "../component"
import { asMountableNode, makeMountableNode } from "../mountable"
import { createDerive, createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derive"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { assert } from "../utils/assert"
import { nameOf, typeOf } from "../utils/name"
import { unhandled } from "../utils/unhandled"
import { valueToNode } from "./node"
import {
	parseTemplateDescriptor,
	TemplateDescriptor,
	TemplateValueDescriptorAttribute,
	TemplateValueDescriptorDirective,
	TemplateValueDescriptorRenderComponent,
	TemplateValueDescriptorRenderNode,
	TemplateValueIndex,
} from "./parse/descriptor"
import { parseTemplateHtml } from "./parse/html"

export type TemplateValue = string | number | boolean | Node | SignalReadable<any> | SignalDeriver<any> | Function | TemplateValue[]
export interface Template {
	strings: TemplateStringsArray
	values: TemplateValue[]
}

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
			if (descriptor instanceof TemplateValueDescriptorRenderNode) {
				const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)!
				outlet.replaceWith(valueToNode(value))
			} else if (descriptor instanceof TemplateValueDescriptorRenderComponent) {
				if (!(value instanceof ComponentElement))
					throw new Error(`Expected ${nameOf(ComponentElement)} at index "${index}", but got ${nameOf(value)}.`)
				const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)!
				value.append(...Array.from(outlet.childNodes))
				outlet.removeAttribute(":outlet")
				for (const attribute of Array.from(outlet.attributes)) value.setAttribute(attribute.name, attribute.value)
				outlet.replaceWith(value)
			} else if (descriptor instanceof TemplateValueDescriptorAttribute) {
				const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
				if (value instanceof Function) values[index] = value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
				if (value instanceof SignalReadable) {
					if (descriptor.quote === "") {
						makeMountableNode(element)
						element.$subscribe(value, (value) => element.setAttribute(descriptor.name, `${value}`), {
							mode: "immediate",
						})
					} else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				} else {
					if (descriptor.quote === "") element.setAttribute(descriptor.name, `${value}`)
					else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				}
			} else if (descriptor instanceof TemplateValueDescriptorDirective) {
				const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
				switch (descriptor.type) {
					case "class":
						if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
						if (value instanceof SignalReadable)
							asMountableNode(element).$subscribe(value, (v) => element.classList.toggle(descriptor.name, !!v), {
								mode: "immediate",
							})
						else element.classList.toggle(descriptor.name, !!value)
						break
					case "style":
						if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
						if (value instanceof SignalReadable)
							asMountableNode(element).$subscribe(value, (v) => element.style.setProperty(descriptor.name, `${v}`), {
								mode: "immediate",
							})
						else element.style.setProperty(descriptor.name, `${value}`)
						break
					case "on":
						if (!(value instanceof Function))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a function, but got ${nameOf(value)}.`)
						makeMountableNode(element)
						element.$onMount(() => element.addEventListener(descriptor.name, value as EventListener))
						element.$onUnmount(() => element.removeEventListener(descriptor.name, value as EventListener))
						break
					case "ref":
						if (!(value instanceof SignalWritable))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(value)}.`)
						value.set(element)
						break
					case "bind":
						if (!(value instanceof SignalWritable))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(value)}.`)
						const signal = value
						assert<HTMLInputElement>(element)
						switch (descriptor.name) {
							case "value:string":
								{
									const listener = () => (signal.ref = element.value)
									makeMountableNode(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.value = `${value}`), { mode: "immediate" })
								}
								break
							case "value:number":
								{
									const listener = () => (signal.ref = element.valueAsNumber)
									makeMountableNode(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.valueAsNumber = value), { mode: "immediate" })
								}
								break
							case "value:date":
								{
									const listener = () => (signal.ref = element.valueAsDate)
									makeMountableNode(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.valueAsDate = value), { mode: "immediate" })
								}
								break
							case "value:boolean":
								{
									const listener = () => (signal.ref = element.checked)
									makeMountableNode(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.checked = value), { mode: "immediate" })
								}
								break
							default:
								throw new Error(`Unknown binding key ${descriptor.name}.`)
						}
						break
					default:
						unhandled("Unhanded directive type", descriptor.type)
				}
			}
		}

		for (const [ref, attributes] of templateDescriptor.refAttributeValueMap) {
			const element = fragment.querySelector(`[\\:ref="${ref}"]`) as HTMLElement
			if (!element) throw new Error(`While rendering attribute parts: Could not find element with ref "${ref}".`)

			for (const [name, parts] of attributes) {
				makeMountableNode(element)
				const signal = createDerive((s) =>
					parts
						.map((part) => {
							const value = part instanceof TemplateValueIndex ? values[part.index] : part
							return value instanceof SignalReadable ? s(value).ref : value
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
