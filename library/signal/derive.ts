import { createReadable, SignalReadable, SignalSubscription } from "./readable"

export type SignalDeriveDependencyAdder = {
	<T>(signal: SignalReadable<T>): SignalReadable<T>
}
export type SignalDeriver<T> = {
	(): T
}

export function createDerive<T>(deriver: SignalDeriver<T>, staticDependencies?: SignalReadable<any>[]): SignalReadable<T> {
	const dependencies = new Set<SignalReadable<any>>(staticDependencies)
	const dependencySubscriptions: SignalSubscription[] = []

	const self = createReadable<T>(null!, (set) => {
		const addDependency: SignalDeriveDependencyAdder = (signal) => {
			if (dependencies.has(signal)) return signal
			// xx console.log("%cadded dependecy", "color:orange", signal.id, "to", self.id)
			dependencies.add(signal)
			dependencySubscriptions.push(signal.subscribe(() => update()))
			return signal
		}

		const update = staticDependencies
			? () => {
					const value = deriver()
					set(value)
			  }
			: () => {
					SignalReadable._SyncContext.push(new Set())
					const value = deriver()

					const syncContext = SignalReadable._SyncContext.pop()!
					syncContext.delete(self as SignalReadable<unknown>)
					syncContext.forEach(addDependency)

					set(value)
			  }

		{
			let i = 0
			for (const dependency of dependencies) dependencySubscriptions[i++] = dependency.subscribe(() => update())
		}
		update()

		return () => dependencySubscriptions.forEach((subscription) => subscription.unsubscribe())
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
export function createOrGetDeriveOfFunction<T>(func: () => T): SignalReadable<T> {
	if (deriveOfFunctionCache.has(func)) return deriveOfFunctionCache.get(func)!
	const computed = createDerive(() => func())
	deriveOfFunctionCache.set(func, computed)
	return computed
}
