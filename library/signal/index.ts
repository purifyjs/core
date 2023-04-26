import { randomId } from "../utils/id"

export type SignalSubscription = {
	unsubscribe(): void
}
export type SignalSubscriptionListener<T> = {
	<U extends T>(value: U): unknown
}
export type SignalSubscriptionOptions = {
	mode: "normal" | "once" | "immediate"
}

export type SignalSetter<T> = {
	<U extends T>(value: U): void
}

export type SignalUpdater<T> = {
	(set: SignalSetter<T>, signal: SignalReadable<T>["signal"]): Function
}

export function createReadable<T>(...params: ConstructorParameters<typeof SignalReadable<T>>) {
	return new SignalReadable<T>(...params)
}

export function createWritable<T>(...params: ConstructorParameters<typeof SignalWritable<T>>) {
	return new SignalWritable<T>(...params)
}

/**
 * @internal
 */
export const signalSyncContextStack: Set<SignalBase>[] = []
class SignalBase<T = unknown> {
	readonly id: string

	readonly #listeners: Set<SignalSubscriptionListener<T>>
	#value: T

	constructor(initial: T) {
		this.id = randomId()
		this.#listeners = new Set()
		this.#value = initial

		this.get = this.get.bind(this)
		this.set = this.set.bind(this)
		this.subscribe = this.subscribe.bind(this)
		this.signal = this.signal.bind(this)
	}

	get(): T {
		if (signalSyncContextStack.length > 0) signalSyncContextStack[signalSyncContextStack.length - 1]!.add(this as SignalBase<unknown>)
		return this.#value
	}
	protected set(value: T) {
		if (this.#value === value) return
		this.#value = value
		this.signal()
	}

	get ref(): T {
		return this.get()
	}

	subscribe(listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription {
		switch (options?.mode) {
			case "once":
				const onceCallback = () => {
					listener(this.get())
					this.#listeners.delete(onceCallback)
				}
				this.#listeners.add(onceCallback)
				break
			case "immediate":
				listener(this.get())
			case "normal":
			default:
				this.#listeners.add(listener)
				break
		}
		return {
			unsubscribe: () => {
				// xx console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				this.#listeners.delete(listener)
			},
		}
	}

	static #signaling = new WeakSet<SignalBase>()
	signal() {
		if (SignalBase.#signaling.has(this)) throw new Error("Avoided recursive signalling.")
		SignalBase.#signaling.add(this)
		this.#listeners.forEach((callback) => callback(this.get()))
		SignalBase.#signaling.delete(this)
	}
}
export { SignalBase as SignalReadable }
class SignalReadable<T = unknown> extends SignalBase<T> {
	#cleaner: Function | null
	#updater: SignalUpdater<T>

	constructor(updater: SignalUpdater<T>, initial?: T) {
		super(initial!)
		this.#updater = updater
		this.#cleaner = null

		this.get = this.get.bind(this)
		this.subscribe = this.subscribe.bind(this)
	}

	#tryActivate() {
		if (this.#cleaner) return false
		this.#cleaner = this.#updater(this.set, this.signal)
		return true
	}

	#tryDeactivate() {
		if (!this.#cleaner) return false
		this.#cleaner()
		this.#cleaner = null
		return true
	}

	override get(): T {
		if (this.#tryActivate()) setTimeout(this.#tryDeactivate, 5000)
		return super.get()
	}

	override subscribe(...args: Parameters<SignalBase<T>["subscribe"]>) {
		this.#tryActivate()
		const subscription = super.subscribe(...args)
		return {
			unsubscribe: () => {
				// xx console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				subscription.unsubscribe()
				this.#tryDeactivate()
			},
		}
	}
}

export class SignalWritable<T> extends SignalBase<T> {
	constructor(value: T) {
		super(value)
		this.set = this.set.bind(this)
	}

	override set(value: T) {
		super.set(value)
	}

	override set ref(value: T) {
		this.set(value)
	}

	override get ref() {
		return super.ref
	}
}
