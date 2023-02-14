import { assert } from "../utils/assert"
import { createReadable, SignalReadable } from "./readable"

interface Suspense<Awaited, Returns, Omits extends string> {
	placeholder<Placeholder extends () => unknown>(
		placeholder: Placeholder
	): Omit<Suspense<Awaited, Returns | ReturnType<Placeholder>, Omits | "placeholder">, Omits | "placeholder">
	error<OnError extends (error: Error) => unknown>(
		error: OnError
	): Omit<Suspense<Awaited, Returns | ReturnType<OnError>, Omits | "error">, Omits | "error">
	result<Result>(then: (awaited: Awaited) => Result): SignalReadable<Returns | Result>
	result(): SignalReadable<Returns | Awaited>
}

export function createSuspense<Awaited>(promise: SignalReadable<Promise<Awaited>> | Promise<Awaited>): Suspense<Awaited, never, never> {
	let placeholder_: (() => unknown) | undefined
	let error_: ((error: Error) => unknown) | undefined

	return {
		placeholder(placeholder) {
			placeholder_ = placeholder
			return this
		},
		error(error) {
			error_ = error
			return this
		},
		result(then?: (awaited: Awaited) => unknown) {
			if (promise instanceof Promise) {
				return createReadable<unknown>(placeholder_?.() ?? null, (set) => {
					promise
						.then((awaited) => then?.(awaited) ?? awaited)
						.catch((error) => error_?.(error) ?? null)
						.then((result) => set(result))

					return () => {}
				}) as SignalReadable<never>
			}

			return createReadable<unknown>(placeholder_?.() ?? null, (set) => {
				let counter = 0
				return promise.subscribe(
					async (value) => {
						const id = ++counter
						try {
							if (placeholder_) set(placeholder_())
							const result = await value
							if (id !== counter) return
							set(then?.(result) ?? result)
						} catch (error) {
							if (id !== counter) return
							assert<Error>(error)
							set(error_?.(error) ?? null)
						}
					},
					{ mode: "immediate" }
				).unsubscribe
			}) as SignalReadable<never>
		},
	}
}
