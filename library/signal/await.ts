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
	let done = false

	return {
		placeholder(placeholder) {
			if (placeholder_) throw new Error("placeholder already set")
			placeholder_ = placeholder
			return this as never
		},
		error(error) {
			if (error_) throw new Error("error already set")
			error_ = error
			return this as never
		},
		$(then?: (awaited: Awaited) => unknown) {
			if (done) throw new Error("await already done")
			done = true

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
				}) as never
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
			}) as never
		},
	}
}
