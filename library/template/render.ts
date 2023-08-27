import type { TemplateValue } from "."
import { onMount$, onUnmount$ } from "../lifecycle"
import type { SignalWritable } from "../signal"
import { isSignalReadable, isSignalWritable } from "../signal"
import { createOrGetDeriveOfFunction, createSignalDerived } from "../signal/derive"
import { assert } from "../utils/assert"
import { nameOf, typeOf } from "../utils/name"
import { unhandled } from "../utils/unhandled"
import { valueToNode } from "./node"
import type { TemplateShape } from "./parse/shape"

export function render(template: HTMLTemplateElement, shape: TemplateShape, values: TemplateValue[]): Node[] {
	const fragment = template.content.cloneNode(true) as DocumentFragment

	try {
		for (let index = 0; index < values.length; index++) {
			const item = shape.items[index]!
			const element = fragment.querySelector(`[ref\\:${item.ref}]`) as HTMLElement

			let value = values[index]!

			if (item.itemType === "node") {
				element.replaceWith(valueToNode(value))
			} else if (item.itemType === "el") {
				if (!(value instanceof Element)) throw new Error(`Expected ${nameOf(Element)} at index "${index}", but got ${nameOf(value)}.`)
				value.append(...Array.from(element.childNodes))
				for (const attribute of Array.from(element.attributes)) value.setAttribute(attribute.name, attribute.value)
				element.replaceWith(value)
			} else if (item.itemType === "attr") {
				if (typeof value === "function") values[index] = value = createOrGetDeriveOfFunction(value as () => TemplateValue)
				if (isSignalReadable(value)) {
					if (item.quote === "") {
						value.subscribe$(
							element,
							(value) => (value === null ? element.removeAttribute(item.name) : element.setAttribute(item.name, `${value}`)),
							{ mode: "immediate" }
						)
					} else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				} else {
					if (item.quote === "") value === null ? element.removeAttribute(item.name) : element.setAttribute(item.name, `${value}`)
					else {
						// Handled at the end. Because this attribute can have multiple values.
					}
				}
			} else if (item.itemType === "dir") {
				switch (item.directiveType) {
					case "class":
						if (typeof value === "function") value = createOrGetDeriveOfFunction(value as () => TemplateValue)
						if (isSignalReadable(value)) {
							value.subscribe$(element, (v) => element.classList.toggle(item.name, !!v), {
								mode: "immediate",
							})
						} else element.classList.toggle(item.name, !!value)
						break
					case "style":
						if (typeof value === "function") value = createOrGetDeriveOfFunction(value as () => TemplateValue)
						if (isSignalReadable(value)) {
							value.subscribe$(element, (v) => element.style.setProperty(item.name, `${v}`), {
								mode: "immediate",
							})
						} else element.style.setProperty(item.name, `${value}`)
						break
					case "on":
						if (!(typeof value === "function")) throw new Error(`${item.itemType}:${item.name} must be a function, but got ${nameOf(value)}.`)

						onMount$(element, () => element.addEventListener(item.name, value as EventListener))
						onUnmount$(element, () => element.removeEventListener(item.name, value as EventListener))
						break
					case "ref":
						if (!isSignalWritable(value)) throw new Error(`${item.itemType}:${item.name} must be a SignalWritable, but got ${typeOf(value)}.`)
						value.set(element)
						break
					case "bind":
						if (!isSignalWritable(value)) throw new Error(`${item.itemType}:${item.name} must be a SignalWritable, but got ${typeOf(value)}.`)
						const signal = value
						assert<HTMLInputElement>(element)
						switch (item.name) {
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
								throw new Error(`Unknown binding key ${item.name}.`)
						}
						break
					default:
						unhandled(`Unhandled directive type`, item.directiveType)
				}
			}
		}

		for (const [ref, { attributes }] of shape.refDataMap) {
			const element = fragment.querySelector(`[ref\\:${ref}]`) as HTMLElement
			for (const [name, { parts }] of attributes) {
				const signal = createSignalDerived(() =>
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
