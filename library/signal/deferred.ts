import { createReadable, type SignalReadable } from "."

export function createDeferred<T>(signal: SignalReadable<T>, timeout_ms: number = 500): SignalReadable<T> {
	return createReadable<T>((set) => {
		let timeout: number | null = null
		return signal.subscribe(
			(value) => {
				set(value)
				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => set(value), timeout_ms)
			},
			{ mode: "immediate" }
		).unsubscribe
	})
}
