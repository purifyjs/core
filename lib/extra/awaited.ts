import type { Signal } from "../core"
import { signal } from "../core"

export let awaited = <T, F = null>(promise: Promise<T>, fallback?: (error?: Error) => F): Readonly<Signal<T | F>> => {
	const promiseSignal = signal<T | F>((fallback ? fallback() : null) as F)
	promise.then((value) => (promiseSignal.ref = value))
	fallback && promise.catch((error) => fallback(error))
	return promiseSignal
}
