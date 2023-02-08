import { makeMountableNode } from "../mountable"
import type { SignalWritable } from "../signal/writable"

export function bindToElement(signal: SignalWritable<unknown>, element: Element, key: string) {
	switch (key) {
		case "value": {
			if (element instanceof HTMLInputElement) {
				switch (element.type) {
					case "radio":
					case "checkbox": {
						const listener = () => (signal.value = element.checked)
						makeMountableNode(element)
						element.$onMount(() => element.addEventListener("input", listener))
						element.$onUnmount(() => element.removeEventListener("input", listener))
						element.$subscribe(signal, (value) => (element.checked = !!value), { mode: "immediate" })
						break
					}
					case "range":
					case "number": {
						const listener = () => (signal.value = element.valueAsNumber)
						makeMountableNode(element)
						element.$onMount(() => element.addEventListener("input", listener))
						element.$onUnmount(() => element.removeEventListener("input", listener))
						element.$subscribe(signal, (value) => (element.valueAsNumber = value as any), {
							mode: "immediate",
						})
						break
					}
					case "date":
					case "datetime-local":
					case "month":
					case "time":
					case "week": {
						const listener = () => (signal.value = element.valueAsDate)
						makeMountableNode(element)
						element.$onMount(() => element.addEventListener("input", listener))
						element.$onUnmount(() => element.removeEventListener("input", listener))
						element.$subscribe(signal, (value) => (element.valueAsDate = value as any), {
							mode: "immediate",
						})
						break
					}
					default: {
						const listener = () => (signal.value = element.value)
						makeMountableNode(element)
						element.$onMount(() => element.addEventListener("input", listener))
						element.$onUnmount(() => element.removeEventListener("input", listener))
						element.$subscribe(signal, (value) => (element.value = `${value}`), { mode: "immediate" })
						break
					}
				}
				break
			} else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
				const listener = () => (signal.value = element.value)
				makeMountableNode(element)
				element.$onMount(() => element.addEventListener("input", listener))
				element.$onUnmount(() => element.removeEventListener("input", listener))
				element.$subscribe(signal, (value) => (element.value = `${value}`), { mode: "immediate" })
				break
			}

			throw new Error(`${element.tagName} does not support binding to ${key}`)
		}
		default:
			throw new Error(`Unknown binding key ${key}`)
	}
}
