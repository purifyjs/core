import { assert } from "../utils/assert"
import { createReadable, SignalReadable } from "./readable"

interface Await<Awaited, Returns> {
	placeholder<Placeholder extends () => unknown>(placeholder: Placeholder): Await<Awaited, Returns | ReturnType<Placeholder>>
	error<OnError extends (error: Error) => unknown>(error: OnError): Await<Awaited, Returns | ReturnType<OnError>>
	then<Result>(then: (awaited: Awaited) => Result): SignalReadable<Returns | Result>
}

export function createAwait<Awaited>(promise: Promise<Awaited> | SignalReadable<Promise<Awaited>>) {
	let placeholder_: () => unknown
	let error_: (error: Error) => unknown

	return {
		placeholder<Placeholder extends () => unknown>(placeholder: Placeholder) {
			placeholder_ = placeholder
			return this
		},
		error<OnError extends (error: Error) => unknown>(error: OnError) {
			error_ = error
			return this
		},
		then<Result>(then: (awaited: Awaited) => Result) {
			if (promise instanceof SignalReadable) {
				return createReadable(placeholder_(), (set) => {
					let counter = 0
					return promise.subscribe(
						async (value) => {
							const id = ++counter
							try {
								set(placeholder_())
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
				})
			} else {
				return createReadable(placeholder_(), (set) => {
					promise.then((value) => set(then(value))).catch((error) => set(error_(error)))
					return () => {}
				})
			}
		},
	} as any as Await<Awaited, never>
}
