import { bindMethods } from "../utils/bind"
import { SignalReadable, SignalSubscription } from "./readable"

export interface SignalDependencyAdder {
	<T extends SignalReadable>(signal: T): T
}
export interface SignalDeriver<T> {
	(addDependency: SignalDependencyAdder): T
}

export function createDerive<T>(...params: ConstructorParameters<typeof SignalDerivable<T>>) {
	return new SignalDerivable<T>(...params)
}

const deriveOfFunctionCache = new WeakMap<SignalDeriver<unknown>, SignalDerivable<any>>()
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
export function createOrGetDeriveOfFunction<T>(func: SignalDeriver<T>): SignalDerivable<T> {
	if (deriveOfFunctionCache.has(func)) return deriveOfFunctionCache.get(func)!
	const computed = createDerive(func)
	deriveOfFunctionCache.set(func, computed)
	return computed
}

export class SignalDerivable<T> extends SignalReadable<T> {
	protected dependencySubscriptions: SignalSubscription[]
	protected dependencies: Set<SignalReadable>
	protected deriver: SignalDeriver<T>

	protected active: boolean = false

	constructor(deriver: SignalDeriver<T>, ...dependencies: SignalReadable[]) {
		super(null!)
		this.deriver = deriver
		this.dependencies = new Set()
		this.dependencySubscriptions = []
		// xx console.log("%cnew derived signal", "color:purple", this.id)
		for (const dependency of dependencies) this.addDependency(dependency)
		bindMethods(this)
	}

	protected activate() {
		if (this.active === true) return
		// xx console.log("%cactivating", "color:blue", this.id, this.deriver)

		this.active = true
		this.dependencies.forEach((updater) => this.dependencySubscriptions.push(updater.subscribe(() => this.signal())))
		this.signal()
	}

	protected deactivate() {
		if (this.active === false) return
		// xx console.log("%cdeactivating", "color:blue", this.id, this.deriver)

		this.active = false
		this.dependencySubscriptions.forEach((subscription) => subscription.unsubscribe())
		this.dependencySubscriptions = []
	}

	public override get() {
		if (this.active === false) this.signal()
		return super.get()
	}

	protected addDependency: SignalDependencyAdder = (dependency) => {
		if (!this.dependencies.has(dependency)) {
			// xx console.log("%cadded dependency", "color:green", dependency.id, "to", this.id)
			this.dependencies.add(dependency)
			this.dependencySubscriptions.push(dependency.subscribe(() => this.signal()))
		}
		return dependency
	}

	public override subscribe(...params: Parameters<SignalReadable<T>["subscribe"]>): ReturnType<SignalReadable<T>["subscribe"]> {
		this.activate()
		const subscription = super.subscribe(...params)

		const superUnsubscribe = subscription.unsubscribe
		subscription.unsubscribe = () => {
			superUnsubscribe()
			if (this._listeners.size === 0) this.deactivate()
		}

		return subscription
	}

	public override signal() {
		const value = this.deriver(this.addDependency)
		if (value === this._value && typeof value !== "object") return
		this._value = value
		super.signal()
	}
}
