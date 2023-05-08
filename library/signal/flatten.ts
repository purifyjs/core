import { isReadable, type SignalReadable } from "."
import { createDerive } from "./derive"

type FlattenSignal<T extends SignalReadable<any>> = T extends SignalReadable<SignalReadable<any>> ? FlattenSignal<T["ref"]> : T

export function flattenSignal<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createDerive(() => {
		let value: SignalReadable = signal
		while (isReadable(value.ref)) value = value.ref
		return value.ref
	}) as unknown as FlattenSignal<T>
}
