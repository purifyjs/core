import { createReadable, SignalReadable } from "../signal/readable"

export function createDeferred<T>(signal: SignalReadable<T>, timeout_ms: number = 500): SignalReadable<T> {
	return createReadable<T>((set) => {
		let timeout: number | null = null
		return signal.subscribe(
			(value) => {
				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => set(value), timeout_ms)
			},
			{ mode: "immediate" }
		).unsubscribe
	}, signal.ref)
}
