import { isSignalReadable, type SignalReadable } from "."
import { createSignalDerived } from "./derive"

type SignalFlatValue<T extends SignalReadable<any>> = T extends SignalReadable<any> ? SignalFlatValue<T["ref"]> : T

export function createSignalFlattened<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createSignalDerived(() => {
		let value: SignalReadable = signal
		while (isSignalReadable(value.ref)) value = value.ref
		return value.ref
	}) as SignalReadable<SignalFlatValue<T>>
}
