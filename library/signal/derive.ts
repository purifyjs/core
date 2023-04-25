import { createReadable, SignalReadable, SignalSetter, SignalSubscription, SyncContextStackSymbol } from "../signal/readable"

export type SignalDeriver<T> = {
	(): T
}

export function createDerive<T>(deriver: SignalDeriver<T>, staticDependencies?: SignalReadable<any>[]): SignalReadable<T> {
	let set: SignalSetter<T>
	let update: () => void
	let dependencyToSubscriptionMap: Map<SignalReadable<unknown>, SignalSubscription | null>
	let updating = false

	if (staticDependencies) {
		dependencyToSubscriptionMap = new Map<SignalReadable<unknown>, SignalSubscription | null>(
			staticDependencies?.map((dependency) => [dependency, null])
		)
		update = () => {
			if (updating) return
			updating = true
			try {
				const value = deriver()
				set(value)
			} catch (error) {
				throw error
			} finally {
				updating = false
			}
		}
	} else {
		dependencyToSubscriptionMap = new Map<SignalReadable<unknown>, SignalSubscription>()
		function addDependency(dependency: SignalReadable<unknown>) {
			dependencyToSubscriptionMap.set(dependency, dependency.subscribe(update))
		}
		update = () => {
			if (updating) return
			updating = true
			try {
				SignalReadable[SyncContextStackSymbol].push(new Set())
				const value = deriver()
				const syncContext = SignalReadable[SyncContextStackSymbol].pop()!
				syncContext.delete(self as SignalReadable<unknown>)
				for (const [dependency, subscription] of dependencyToSubscriptionMap.entries()) {
					if (syncContext.has(dependency)) {
						syncContext.delete(dependency)
					} else {
						subscription?.unsubscribe()
						dependencyToSubscriptionMap.delete(dependency)
					}
				}
				syncContext.forEach(addDependency)

				set(value)
			} catch (error) {
				throw error
			} finally {
				updating = false
			}
		}
	}

	const self = createReadable<T>((_set) => {
		dependencyToSubscriptionMap.delete(self as SignalReadable<unknown>)
		set = _set
		for (const dependency of dependencyToSubscriptionMap.keys()) dependencyToSubscriptionMap.set(dependency, dependency.subscribe(update))
		update()
		return () => {
			for (const subscription of dependencyToSubscriptionMap.values()) subscription?.unsubscribe()
		}
	})
	return self
}

const deriveOfFunctionCache = new WeakMap<SignalDeriver<unknown>, SignalReadable<any>>()
/**
 * Same as createDerive, but specialized for functions.
 *
 * Derives a signal from a function.
 *
 * Cache is used to ensure that the same signal is returned for the same function.
 *
 * Used internally to convert functions in html to derived signals.
 * @param func The function that derives the value of the signal.
 * @returns The signal that is derived from the function.
 * @example
 * const double = m.deriveFromFunction((s) => s(foo).value * 2)
 **/
export function createOrGetDeriveOfFunction<T extends (...args: any) => any>(func: T): SignalReadable<ReturnType<T>> {
	if (deriveOfFunctionCache.has(func)) return deriveOfFunctionCache.get(func)!
	const computed = createDerive(() => func())
	deriveOfFunctionCache.set(func, computed)
	return computed
}
