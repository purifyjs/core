import { assert } from "../utils/assert"
import { createDerive, SignalDeriver } from "./derive"
import { createReadable, SignalReadable } from "./readable"

interface Await<Awaited, Returns, Omits extends string> {
	placeholder<Placeholder extends () => unknown>(
		placeholder: Placeholder
	): Omit<Await<Awaited, Returns | ReturnType<Placeholder>, Omits | "placeholder">, Omits | "placeholder">
	error<OnError extends (error: Error) => unknown>(
		error: OnError
	): Omit<Await<Awaited, Returns | ReturnType<OnError>, Omits | "error">, Omits | "error">
	then<Result>(then: (awaited: Awaited) => Result): SignalReadable<Returns | Result>
}

export function createAwait<Awaited>(promiseDeriver: SignalDeriver<Promise<Awaited>>): Await<Awaited, never, never> {
	let placeholder_: () => unknown
	let error_: (error: Error) => unknown

	return {
		placeholder(placeholder) {
			placeholder_ = placeholder
			return this
		},
		error(error) {
			error_ = error
			return this
		},
		then(then) {
			const signal = createDerive(promiseDeriver)
			return createReadable<unknown>(placeholder_?.() ?? null, (set) => {
				let counter = 0
				return signal.subscribe(
					async (value) => {
						const id = ++counter
						try {
							if (placeholder_) set(placeholder_())
							const result = await value
							if (id !== counter) return
							set(then(result))
						} catch (error) {
							if (id !== counter) return
							assert<Error>(error)
							set(error_(error))
						}
					},
					{ mode: "immediate" }
				).unsubscribe
			}) as SignalReadable<never>
		},
	}
}
