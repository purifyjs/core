import { assert } from "../utils/assert"
import { createReadable, SignalReadable } from "./readable"

type Placeholder = () => unknown
type ErrorHandler = (error: Error) => unknown

type Await<TAwaited, TReturns, TOmits extends keyof Await<any, any, any>> = {
	placeholder<TPlaceholder extends Placeholder>(
		placeholder: TPlaceholder
	): Omit<Await<TAwaited, TReturns | ReturnType<TPlaceholder>, TOmits | "placeholder">, TOmits | "placeholder">
	error<TError extends ErrorHandler>(error: TError): Omit<Await<TAwaited, TReturns | ReturnType<TError>, TOmits | "error">, TOmits | "error">
	then<TResult>(then: (awaited: TAwaited) => TResult): SignalReadable<TReturns | TResult>
	then(): SignalReadable<TReturns | TAwaited>
}

export function createAwait<Awaited>(promise: SignalReadable<Promise<Awaited>> | Promise<Awaited>): Await<Awaited, never, never> {
	let placeholder_: Placeholder | undefined
	let error_: ErrorHandler | undefined

	return {
		placeholder(placeholder) {
			delete (this as Partial<typeof this>).placeholder
			placeholder_ = placeholder
			return this as never
		},
		error(error) {
			delete (this as Partial<typeof this>).error
			error_ = error
			return this as never
		},
		then(then?: (awaited: Awaited) => unknown) {
			delete (this as Partial<typeof this>).then

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
