import { assert } from "../utils/assert"
import { createReadable, SignalReadable } from "./readable"

type Await<Awaited, Returns, Omits extends string> = {
	placeholder<Placeholder extends () => unknown>(
		placeholder: Placeholder
	): Omit<Await<Awaited, Returns | ReturnType<Placeholder>, Omits | "placeholder">, Omits | "placeholder">
	error<OnError extends (error: Error) => unknown>(
		error: OnError
	): Omit<Await<Awaited, Returns | ReturnType<OnError>, Omits | "error">, Omits | "error">
	$<Result>(then: (awaited: Awaited) => Result): SignalReadable<Returns | Result>
	$(): SignalReadable<Returns | Awaited>
}

export function createAwait<Awaited>(promise: SignalReadable<Promise<Awaited>> | Promise<Awaited>): Await<Awaited, never, never> {
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
		$(then?: (awaited: Awaited) => unknown) {
			if (promise instanceof Promise) {
				return createReadable<unknown>(placeholder_ ? placeholder_() : null, (set) => {
					promise
						.then((awaited) => (then ? then(awaited) : awaited))
						.catch((error) => {
							if (!error_) throw error
							set(error_)
						})
						.then((result) => set(result))

					return () => {}
				}) as SignalReadable<never>
			}

			return createReadable<unknown>(placeholder_ ? placeholder_() : null, (set) => {
				let counter = 0
				return promise.subscribe(
					async (value) => {
						const id = ++counter
						try {
							if (placeholder_ !== undefined) set(placeholder_())
							const result = await value
							if (id !== counter) return
							set(then ? then(result) : result)
						} catch (error) {
							if (id !== counter) return
							assert<Error>(error)
							if (!error_) throw error
							set(error_(error))
						}
					},
					{ mode: "immediate" }
				).unsubscribe
			}) as SignalReadable<never>
		},
	}
}
