import { createReadable, SignalReadable } from "../signal/readable"

export function createDeferred<T>(signal: SignalReadable<T>, timeout_ms: number = 1000): SignalReadable<T> {
	return createReadable<T>(signal.ref, (set) => {
		let timeout: number | null = null
		return signal.subscribe(() => {
			if (timeout) return
			timeout = setTimeout(() => {
				timeout = null
				set(signal.ref)
			}, timeout_ms)
		}).unsubscribe
	})
}
