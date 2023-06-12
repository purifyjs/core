import { createSignalReadable, type SignalReadable } from "../signal.js"

export function createSignalDeferred<T>(signal: SignalReadable<T>, timeout_ms: number = 500): SignalReadable<T> {
	return createSignalReadable<T>((set) => {
		let timeout: NodeJS.Timeout | null = null
		set(signal.get(true))
		return signal.subscribe(
			(value) => {
				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => set(value), timeout_ms)
			},
			{ mode: "immediate" }
		).unsubscribe
	})
}
