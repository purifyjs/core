import { assert } from "../utils/assert"
import { createReadable, SignalReadable } from "../signal/readable"
import { createWritable } from "./writable"
import { RenderSymbol } from "../template/renderable"

type Placeholder = () => unknown
type ErrorHandler = (error: Error) => unknown

type AwaitPromise<TAwaited, TReturns = never, TUsed extends keyof AwaitPromise<any, any, any> = never> = {
	placeholder<TPlaceholder extends Placeholder>(
		placeholder: TPlaceholder
	): Omit<AwaitPromise<TAwaited, TReturns | ReturnType<TPlaceholder>, TUsed | "placeholder">, TUsed | "placeholder">
	error<TError extends ErrorHandler>(error: TError): Omit<AwaitPromise<TAwaited, TReturns | ReturnType<TError>, TUsed | "error">, TUsed | "error">
	then<TAs>(as: (awaited: TAwaited) => TAs): SignalReadable<TReturns | TAs>
	then(): SignalReadable<TReturns | TAwaited>
	[RenderSymbol](): SignalReadable<TReturns | TAwaited>
}

type AwaitPromiseSignal<TAwaited, TOther = never, TUsed extends keyof AwaitPromiseSignal<any, any, any> = never> = {
	placeholder<TPlaceholder extends Placeholder>(
		placeholder: TPlaceholder
	): Omit<AwaitPromiseSignal<TAwaited, TOther | ReturnType<TPlaceholder>, TUsed | "placeholder">, TUsed | "placeholder">
	error<TError extends ErrorHandler>(
		error: TError
	): Omit<AwaitPromiseSignal<TAwaited, TOther | ReturnType<TError>, TUsed | "error">, TUsed | "error">
	then<TAs>(as: (awaited: SignalReadable<TAwaited>) => TAs): SignalReadable<TOther | TAs>
	then(): SignalReadable<TOther | TAwaited>
	[RenderSymbol](): SignalReadable<TOther | TAwaited>
}

function awaitPromise<Awaited>(promise: Promise<Awaited>): AwaitPromise<Awaited> {
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
			return createReadable(placeholder_ ? placeholder_() : null, (set) => {
				promise
					.then((awaited) => (then ? then(awaited) : awaited))
					.catch((error) => {
						if (!error_) throw error
						set(error_)
					})
					.then((result) => set(result))
				return () => {}
			}) as never
		},
		[RenderSymbol]() {
			return this.then()
		},
	}
}

function awaitPromiseSignal<Awaited>(promiseSignal: SignalReadable<Promise<Awaited>>): AwaitPromiseSignal<Awaited> {
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
		then(then?: (awaited: SignalReadable<Awaited>) => unknown) {
			delete (this as Partial<typeof this>).then
			return createReadable<unknown>(placeholder_ ? placeholder_() : null, (set) => {
				let counter = 0

				let thenCache: unknown
				const awaitedSignal = createWritable<Awaited>(null!)

				return promiseSignal.subscribe(
					async (promise) => {
						const id = ++counter
						try {
							if (placeholder_ !== undefined) set(placeholder_())
							const awaited = await promise
							if (id !== counter) return
							awaitedSignal.ref = awaited
							set(then ? (thenCache ??= then(awaitedSignal)) : awaited)
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
		[RenderSymbol]() {
			return this.then()
		},
	}
}

export const createAwait: {
	<Awaited>(promise: Promise<Awaited>): AwaitPromise<Awaited>
	<Awaited>(promiseSignal: SignalReadable<Promise<Awaited>>): AwaitPromiseSignal<Awaited>
} = (promise) => {
	if (promise instanceof SignalReadable) return awaitPromiseSignal(promise)
	return awaitPromise(promise)
}
