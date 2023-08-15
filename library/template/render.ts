import { onMount$, onUnmount$ } from "../lifecycle/index"
import { createOrGetDeriveOfFunction, createSignalDerive } from "../signal/derive"
import type { SignalWritable } from "../signal/index"
import { isSignalReadable, isSignalWritable } from "../signal/index"
import { assert } from "../utils/assert"
import { nameOf, typeOf } from "../utils/name"
import { unhandled } from "../utils/unhandled"
import type { TemplateValue } from "./index"
import { valueToNode } from "./node"
import type { TemplateDescriptor } from "./parse/descriptor"

export function render<T extends TemplateValue[]>(template: HTMLTemplateElement, templateDescriptor: TemplateDescriptor, values: T): Node[] {
	const fragment = template.content.cloneNode(true) as DocumentFragment

	try {
		for (let index = 0; index < values.length; index++) {
			const descriptor = templateDescriptor.valueDescriptors[index]!
			const element = fragment.querySelector(`[ref\\:${descriptor.ref}]`) as HTMLElement

			let value = values[index] as unknown

			if (descriptor.type === "render-node") {
				element.replaceWith(valueToNode(value))
			} else if (descriptor.type === "render-element") {
				if (!(value instanceof Element)) throw new Error(`Expected ${nameOf(Element)} at index "${index}", but got ${nameOf(value)}.`)
				value.append(...Array.from(element.childNodes))
				for (const attribute of Array.from(element.attributes)) value.setAttribute(attribute.name, attribute.value)
				element.replaceWith(value)
			} else if (descriptor.type === "attribute") {
				if (typeof value === "function") values[index] = value = createOrGetDeriveOfFunction(value as () => TemplateValue)
				if (isSignalReadable(value)) {
					if (descriptor.quote === "") {
						value.subscribe$(
							element,
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
			} else if (descriptor.type === "directive") {
				switch (descriptor.directive) {
					case "class":
						if (typeof value === "function") value = createOrGetDeriveOfFunction(value as () => TemplateValue)
						if (isSignalReadable(value)) {
							value.subscribe$(element, (v) => element.classList.toggle(descriptor.name, !!v), {
								mode: "immediate",
							})
						} else element.classList.toggle(descriptor.name, !!value)
						break
					case "style":
						if (typeof value === "function") value = createOrGetDeriveOfFunction(value as () => TemplateValue)
						if (isSignalReadable(value)) {
							value.subscribe$(element, (v) => element.style.setProperty(descriptor.name, `${v}`), {
								mode: "immediate",
							})
						} else element.style.setProperty(descriptor.name, `${value}`)
						break
					case "on":
						if (!(typeof value === "function"))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a function, but got ${nameOf(value)}.`)

						onMount$(element, () => element.addEventListener(descriptor.name, value as EventListener))
						onUnmount$(element, () => element.removeEventListener(descriptor.name, value as EventListener))
						break
					case "ref":
						if (!isSignalWritable(value))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a SignalWritable, but got ${typeOf(value)}.`)
						value.set(element)
						break
					case "bind":
						if (!isSignalWritable(value))
							throw new Error(`${descriptor.type}:${descriptor.name} must be a SignalWritable, but got ${typeOf(value)}.`)
						const signal = value
						assert<HTMLInputElement>(element)
						switch (descriptor.name) {
							case "value:string":
								{
									const listener = () => (signal.ref = element.value)

									onMount$(element, () => element.addEventListener("input", listener))
									onUnmount$(element, () => element.removeEventListener("input", listener))
									signal.subscribe$(element, (value) => (element.value = `${value}`), { mode: "immediate" })
								}
								break
							case "value:number":
								{
									assert<SignalWritable<number>>(signal)
									const listener = () => (signal.ref = element.valueAsNumber)

									onMount$(element, () => element.addEventListener("input", listener))
									onUnmount$(element, () => element.removeEventListener("input", listener))
									signal.subscribe$(element, (value) => (element.valueAsNumber = value), { mode: "immediate" })
								}
								break
							case "value:date":
								{
									assert<SignalWritable<Date | null>>(signal)
									const listener = () => (signal.ref = element.valueAsDate)

									onMount$(element, () => element.addEventListener("input", listener))
									onUnmount$(element, () => element.removeEventListener("input", listener))
									signal.subscribe$(element, (value) => (element.valueAsDate = value), { mode: "immediate" })
								}
								break
							case "value:boolean":
								{
									assert<SignalWritable<boolean>>(signal)
									const listener = () => (signal.ref = element.checked)

									onMount$(element, () => element.addEventListener("input", listener))
									onUnmount$(element, () => element.removeEventListener("input", listener))
									signal.subscribe$(element, (value) => (element.checked = value), { mode: "immediate" })
								}
								break
							default:
								throw new Error(`Unknown binding key ${descriptor.name}.`)
						}
						break
					default:
						unhandled(`Unhandled directive type`, descriptor.directive)
				}
			}
		}

		for (const [ref, { attributes }] of templateDescriptor.refDataMap) {
			const element = fragment.querySelector(`[ref\\:${ref}]`) as HTMLElement
			for (const [name, { parts }] of attributes) {
				const signal = createSignalDerive(() =>
					parts!
						.map((part) => {
							const value = typeof part === "number" ? values[part] : part
							return isSignalReadable(value) ? value.ref : value
						})
						.join("")
				)
				signal.subscribe$(element, (value) => element.setAttribute(name, value), {
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
