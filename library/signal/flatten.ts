import { isReadable, type SignalReadable } from "."
import { createDerive } from "./derive"

// TODO; Remove the need for this if posibble. posibble solution is. Maybe if a signal has a value as a signal, it might act as a bridge to it, this would solve other problems too
// this ^ solution seems problematic because for it to work right, once we set something to a signal it should stay as that

type FlattenSignal<T extends SignalReadable<any>> = T extends SignalReadable<SignalReadable<any>> ? FlattenSignal<T["ref"]> : T

export function flattenSignal<T extends SignalReadable<SignalReadable<any>>>(signal: T) {
	return createDerive(() => {
		let value: SignalReadable = signal
		while (isReadable(value.ref)) value = value.ref
		return value.ref
	}) as unknown as FlattenSignal<T>
}
