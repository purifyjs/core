import { RenderSymbol } from "../template/renderable"
import type { SignalReadable, SignalWritable } from "./index"
import { createSignalReadable, createSignalWritable, isSignalReadable } from "./index"

type AwaitPromiseBuilder<TValue> = {
	until<TUntil>(until: () => TUntil): {
		catch<TCatch>(onrejected: (reason: unknown) => TCatch): AwaitPromiseBuilder.Then<TValue, TUntil | TCatch>
	} & AwaitPromiseBuilder.Then<TValue, TUntil>
	catch<TCatch>(onrejected: (reason: unknown) => TCatch): {
		until<TUntil>(until: () => TUntil): AwaitPromiseBuilder.Then<TValue, TUntil | TCatch>
	} & AwaitPromiseBuilder.Then<TValue, null | TCatch>
} & AwaitPromiseBuilder.Then<TValue, null>
namespace AwaitPromiseBuilder {
	export type Then<TValue, TOther> = {
		then<TThen>(onfulfilled: (value: TValue) => TThen): SignalReadable<TOther | TThen>
		then(): SignalReadable<TOther | TValue>
		[RenderSymbol](): SignalReadable<TOther | TValue>
	}
}

function awaitPromise<TValue>(promise: Promise<TValue>): AwaitPromiseBuilder<TValue> {
	function then<TUntil = never, TCatch = never>(
		until?: () => TUntil,
		onrejected?: (reason: unknown) => TCatch
	): AwaitPromiseBuilder.Then<TValue, TUntil | TCatch> {
		return {
			then<TThen = TValue>(onfulfilled?: (value: TValue) => TThen) {
				return createSignalReadable<TUntil | TCatch | TThen>((set) => {
					if (until) set(until())
					else set(null!)
					promise
						.then((value) => set(onfulfilled ? onfulfilled(value) : (value as any)))
						.catch((reason) => set(onrejected ? onrejected(reason) : reason))
					return () => {}
				})
			},
			[RenderSymbol]() {
				return this.then()
			},
		}
	}

	return {
		until(until) {
			return {
				catch(onrejected) {
					return then(until, onrejected)
				},
				...then(until),
			}
		},
		catch(onrejected) {
			return {
				until(until) {
					return then(until, onrejected)
				},
				...then(undefined, onrejected),
			}
		},
		...then(),
	}
}

type AwaitPromiseSignalBuilder<TValue> = {
	until<TUntil>(until: () => TUntil): {
		catch<TCatch>(onrejected: (reason: SignalReadable<unknown>) => TCatch): AwaitPromiseSignalBuilder.Then<TValue, TUntil | TCatch>
	} & AwaitPromiseSignalBuilder.Then<TValue, TUntil>
	catch<TCatch>(onrejected: (reason: SignalReadable<unknown>) => TCatch): {
		until<TUntil>(until: () => TUntil): AwaitPromiseSignalBuilder.Then<TValue, TUntil | TCatch>
	} & AwaitPromiseSignalBuilder.Then<TValue, null | TCatch>
} & AwaitPromiseSignalBuilder.Then<TValue, null>
namespace AwaitPromiseSignalBuilder {
	export type Then<TValue, TOther> = {
		then<TThen>(onfulfilled: (value: SignalReadable<TValue>) => TThen): SignalReadable<TOther | TThen>
		then(): SignalReadable<TOther | TValue>
		[RenderSymbol](): SignalReadable<TOther | TValue>
	}
}

function awaitPromiseSignal<TValue>(promiseSignal: SignalReadable<Promise<TValue>>): AwaitPromiseSignalBuilder<TValue> {
	function then<TUntil = never, TCatch = never>(until?: () => TUntil, onrejected?: (reason: SignalReadable<unknown>) => TCatch) {
		return {
			then<TThen = TValue>(onfulfilled?: (value: SignalReadable<TValue>) => TThen) {
				return createSignalReadable<TUntil | TCatch | TThen>((set) => {
					let onrejectedSignal: SignalWritable<unknown> | null = null
					let onfulfilledSignal: SignalWritable<TValue> | null = null

					let onfulfilledResult: TThen | null = null
					let onrejectedResult: TCatch | null = null

					let promiseCache: Promise<TValue> | null = null
					const subscription = promiseSignal.subscribe(
						(promise) => {
							promiseCache = promise

							if (until) set(until())
							else set(null!)

							promise
								.then((value) => {
									if (promiseCache !== promise) return
									if (onfulfilled) {
										if (onfulfilledSignal) onfulfilledSignal.set(value)
										else onfulfilledSignal = createSignalWritable(value)
										set((onfulfilledResult ??= onfulfilled(onfulfilledSignal)))
									} else {
										set(value as any)
									}
								})
								.catch((reason) => {
									if (promiseCache !== promise) return
									if (onrejected) {
										if (onrejectedSignal) onrejectedSignal.set(reason)
										else onrejectedSignal = createSignalWritable(reason)
										set((onrejectedResult ??= onrejected(onrejectedSignal)))
									}
								})

							return () => {}
						},
						{ mode: "immediate" }
					)

					return () => subscription.unsubscribe()
				})
			},
			[RenderSymbol]() {
				return this.then()
			},
		}
	}

	return {
		until(until) {
			return {
				catch(onrejected) {
					return then(until, onrejected)
				},
				...then(until),
			}
		},
		catch(onrejected) {
			return {
				until(until) {
					return then(until, onrejected)
				},
				...then(undefined, onrejected),
			}
		},
		...then(),
	}
}

export const createSignalAwait: {
	<T>(promise: Promise<T>): AwaitPromiseBuilder<T>
	<T>(promiseSignal: SignalReadable<Promise<T>>): AwaitPromiseSignalBuilder<T>
} = (promise) => {
	if (isSignalReadable(promise)) return awaitPromiseSignal(promise) as never
	return awaitPromise(promise) as never
}
