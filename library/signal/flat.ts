import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

type FlattenSignal<T extends SignalReadable<any>> = T extends SignalReadable<SignalReadable<any>> ? FlattenSignal<T["ref"]> : T

export function flattenSignal<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createDerive(() => {
		let value: SignalReadable = signal
		while (value.ref instanceof SignalReadable) value = value.ref
		return value
	}) as unknown as FlattenSignal<T>
}
