import type { SignalReadable, SignalSetter, SignalSubscription } from "."
import { createSignalReadable, signalSyncContextStack } from "."

export interface SignalDeriver<T> {
	(): T
}

export function createSignalDerived<T>(deriver: SignalDeriver<T>, staticDependencies?: SignalReadable<any>[]): SignalReadable<T> {
	let activate: (set: SignalSetter<T>) => void
	let deactivate: () => void

	if (staticDependencies) {
		const subscriptions = new Array<SignalSubscription>(staticDependencies.length)
		activate = (set: SignalSetter<T>) => {
			// xx console.log("%cactivating static derive", "color:green", self.id, arrayFrom(staticDependencies))
			function update() {
				signalSyncContextStack.push(new Set())
				set(deriver())
				signalSyncContextStack.pop()
			}
			for (let i = 0; i < staticDependencies.length; i++) subscriptions[i] = staticDependencies[i]!.subscribe(update)
			update()
		}
		deactivate = () => {
			// xx console.log("%cdeactivating static derive", "color:green", self.id, arrayFrom(staticDependencies))
			for (let i = 0; i < subscriptions.length; i++) {
				subscriptions[i]!.unsubscribe()
				delete subscriptions[i]
			}
		}
	} else {
		const dependencyToSubscriptionMap = new Map<SignalReadable<unknown>, SignalSubscription>()

		activate = (set: SignalSetter<T>) => {
			// xx console.log("%cactivating derive", "color:green", self.id, arrayFrom(dependencyToSubscriptionMap))
			function update() {
				signalSyncContextStack.push(new Set())
				const value = deriver()
				const syncContext = signalSyncContextStack.pop()!
				syncContext.delete(self)

				const dependenciesToDelete = new Set<SignalReadable>()
				for (const [dependency, subscription] of dependencyToSubscriptionMap.entries()) {
					if (!syncContext.has(dependency)) {
						subscription.unsubscribe()
						dependenciesToDelete.add(dependency)
					}
				}
				dependenciesToDelete.forEach((dependency) => dependencyToSubscriptionMap.delete(dependency))

				syncContext.forEach((dependency) => {
					if (dependencyToSubscriptionMap.has(dependency)) return
					dependencyToSubscriptionMap.set(dependency, dependency.subscribe(update))
				})

				set(value)
			}
			update()
		}
		deactivate = () => {
			// xx console.log("%cdeactivating derive", "color:green", self.id, arrayFrom(dependencyToSubscriptionMap))
			for (const subscription of dependencyToSubscriptionMap.values()) subscription.unsubscribe()
			dependencyToSubscriptionMap.clear()
		}
	}

	const self = createSignalReadable<T>((set) => {
		activate(set)
		return deactivate
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
	const computed = createSignalDerived(() => func())
	deriveOfFunctionCache.set(func, computed)
	return computed
}
