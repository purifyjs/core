import type { TemplateValue } from "."
import { Component } from "../component"
import { mountableNodeAssert } from "../mountable"
import { createDerive, createOrGetDeriveOfFunction } from "../signal/derive"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { assert } from "../utils/assert"
import { nameOf, typeOf } from "../utils/name"
import { unhandled } from "../utils/unhandled"
import { valueToNode } from "./node"
import { checkValueDescriptorType, TemplateDescriptor } from "./parse/descriptor"

export function render<T extends TemplateValue[]>(template: HTMLTemplateElement, templateDescriptor: TemplateDescriptor, values: T): Node[] {
	const fragment = template.content.cloneNode(true) as DocumentFragment

	try {
		for (let index = 0; index < values.length; index++) {
			const descriptor = templateDescriptor.valueDescriptors[index]!
			const element = fragment.querySelector(`[ref\\:${descriptor.ref}]`) as HTMLElement

			let value = values[index]

			if (checkValueDescriptorType("render-node", descriptor)) {
				element.replaceWith(valueToNode(value))
			} else if (checkValueDescriptorType("render-component", descriptor)) {
				if (!(value instanceof Component)) throw new Error(`Expected ${nameOf(Component)} at index "${index}", but got ${nameOf(value)}.`)
				value.append(...Array.from(element.childNodes))
				for (const attribute of Array.from(element.attributes)) value.setAttribute(attribute.name, attribute.value)
				element.replaceWith(value)
			} else if (checkValueDescriptorType("attribute", descriptor)) {
				if (value instanceof Function) values[index] = value = createOrGetDeriveOfFunction(value as () => unknown)
				if (value instanceof SignalReadable) {
					if (descriptor.quote === "") {
						mountableNodeAssert(element)
						element.$subscribe(
							value,
							(value) =>
								value === null ? element.removeAttribute(descriptor.name) : element.setAttribute(descriptor.name, `${value}`),
							{ mode: "immediate" }
						)
					} else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				} else {
					if (descriptor.quote === "")
						value === null ? element.removeAttribute(descriptor.name) : element.setAttribute(descriptor.name, `${value}`)
					else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				}
			} else if (checkValueDescriptorType("directive", descriptor)) {
				switch (descriptor.directive) {
					case "class":
						if (value instanceof Function) value = createOrGetDeriveOfFunction(value as () => unknown)
						if (value instanceof SignalReadable) {
							mountableNodeAssert(element)
							element.$subscribe(value, (v) => element.classList.toggle(descriptor.name, !!v), {
								mode: "immediate",
							})
						} else element.classList.toggle(descriptor.name, !!value)
						break
					case "style":
						if (value instanceof Function) value = createOrGetDeriveOfFunction(value as () => unknown)
						if (value instanceof SignalReadable) {
							mountableNodeAssert(element)
							element.$subscribe(value, (v) => element.style.setProperty(descriptor.name, `${v}`), {
								mode: "immediate",
							})
						} else element.style.setProperty(descriptor.name, `${value}`)
						break
					case "on":
						if (!(value instanceof Function))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a function, but got ${nameOf(value)}.`)
						mountableNodeAssert(element)
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
									mountableNodeAssert(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.value = `${value}`), { mode: "immediate" })
								}
								break
							case "value:number":
								{
									const listener = () => (signal.ref = element.valueAsNumber)
									mountableNodeAssert(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.valueAsNumber = value), { mode: "immediate" })
								}
								break
							case "value:date":
								{
									const listener = () => (signal.ref = element.valueAsDate)
									mountableNodeAssert(element)
									element.$onMount(() => element.addEventListener("input", listener))
									element.$onUnmount(() => element.removeEventListener("input", listener))
									element.$subscribe(signal, (value) => (element.valueAsDate = value), { mode: "immediate" })
								}
								break
							case "value:boolean":
								{
									const listener = () => (signal.ref = element.checked)
									mountableNodeAssert(element)
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
						unhandled("Unhanded directive type", descriptor.directive)
				}
			}
		}

		for (const [ref, { attributes }] of templateDescriptor.refDataMap) {
			const element = fragment.querySelector(`[ref\\:${ref}]`) as HTMLElement
			for (const [name, { parts }] of attributes) {
				mountableNodeAssert(element)
				const signal = createDerive(() =>
					parts!
						.map((part) => {
							const value = typeof part === "number" ? values[part] : part
							return value instanceof SignalReadable ? value.ref : value
						})
						.join("")
				)
				element.$subscribe(signal, (value) => element.setAttribute(name, value), {
					mode: "immediate",
				})
			}
		}
	} catch (error) {
		console.error("Error while rendering template:", error, "values:", values, "html:", template.innerHTML.trim())
		throw error
	}

	return Array.from(fragment.childNodes)
}
