import { createDerive } from "./derive"
import { SignalReadable } from "./readable"

// TODO; Remove the need for this if posibble. posibble solution is. Maybe if a signal has a value as a signal, it might act as a bridge to it, this would solve other problems too

type FlattenSignal<T extends SignalReadable<any>> = T extends SignalReadable<SignalReadable<any>> ? FlattenSignal<T["ref"]> : T

export function flattenSignal<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createDerive(() => {
		let value: SignalReadable = signal
		while (value.ref instanceof SignalReadable) value = value.ref
		return value.ref
	}) as unknown as FlattenSignal<T>
}
