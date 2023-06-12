import { isSignalReadable, type SignalReadable } from "../signal.js"
import { createSignalDerive } from "./derive.js"

export type SignalFlattened<T extends SignalReadable<any>> = T extends SignalReadable<SignalReadable<any>> ? SignalFlattened<T["ref"]> : T

export function createSignalFlattened<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createSignalDerive(() => {
		let value: SignalReadable = signal
		while (isSignalReadable(value.ref)) value = value.ref
		return value.ref
	}) as unknown as SignalFlattened<T>
}
