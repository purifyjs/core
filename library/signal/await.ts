import { RenderSymbol } from "../template/renderable"
import { assert } from "../utils/assert"
import type { SignalReadable } from "./index"
import { createSignalReadable, createSignalWritable, isSignalReadable } from "./index"

type Until = () => unknown
type Catch = (error: Error) => unknown

type AwaitPromise<TAwaited, TReturns = never> = {
	until<T extends Until>(until: T): AwaitPromise<TAwaited, TReturns | ReturnType<T>>
	catch<T extends Catch>(onrejected: T): AwaitPromise<TAwaited, TReturns | ReturnType<T>>
	then<T>(onfulfilled: (awaited: TAwaited) => T): SignalReadable<TReturns | T>
	then(): SignalReadable<TReturns | TAwaited>
	[RenderSymbol](): SignalReadable<TReturns | TAwaited>
}
type AwaitPromiseSignal<TAwaited, TOther = never> = {
	until<T extends Until>(until: T): AwaitPromiseSignal<TAwaited, TOther | ReturnType<T>>
	catch<T extends Catch>(onrejected: T): AwaitPromiseSignal<TAwaited, TOther | ReturnType<T>>
	then<T>(onfulfilled: (awaited: SignalReadable<TAwaited>) => T): SignalReadable<TOther | T>
	then(): SignalReadable<TOther | TAwaited>
	[RenderSymbol](): SignalReadable<TOther | TAwaited>
}

function awaitPromise<Awaited>(promise: Promise<Awaited>): AwaitPromise<Awaited> {
	let _until: Until | undefined
	let _onrejected: Catch | undefined

	return {
		until(until) {
			_until = until
			return this
		},
		catch(onrejected) {
			_onrejected = onrejected
			return this
		},
		then(then?: (awaited: Awaited) => unknown) {
			const until = _until
			const onrejected = _onrejected

			return createSignalReadable(
				(set) => {
					promise
						.then((awaited) => (then ? then(awaited) : awaited))
						.catch((error) => {
							if (!onrejected) throw error
							set(onrejected)
						})
						.then((result) => set(result))
					return () => {}
				},
				until ? until() : null
			) as never
		},
		[RenderSymbol]() {
			return this.then()
		},
	}
}

function awaitPromiseSignal<Awaited>(promiseSignal: SignalReadable<Promise<Awaited>>): AwaitPromiseSignal<Awaited> {
	let _until: Until | undefined
	let _onrejected: Catch | undefined

	return {
		until(until) {
			_until = until
			return this
		},
		catch(onrejected) {
			_onrejected = onrejected
			return this
		},
		then(then?: (awaited: SignalReadable<Awaited>) => unknown) {
			const until = _until
			const onrejected = _onrejected

			return createSignalReadable<unknown>(
				(set) => {
					let counter = 0

					let thenCache: unknown
					const awaitedSignal = createSignalWritable<Awaited>(null!)

					return promiseSignal.subscribe(
						async (promise) => {
							const id = ++counter
							try {
								if (until !== undefined) set(until())
								const awaited = await promise
								if (id !== counter) return
								awaitedSignal.ref = awaited
								set(then ? (thenCache ??= then(awaitedSignal)) : awaited)
							} catch (error) {
								if (id !== counter) return
								assert<Error>(error)
								if (!onrejected) throw error
								set(onrejected(error))
							}
						},
						{ mode: "immediate" }
					).unsubscribe
				},
				until ? until() : null
			) as never
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
	if (isSignalReadable(promise)) return awaitPromiseSignal(promise)
	return awaitPromise(promise)
}
