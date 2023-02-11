import { bindMethods } from "../utils/bind"
import { randomId } from "../utils/id"

export interface SignalSubscription {
	unsubscribe(): void
}
export interface SignalSubscriptionListener<T> {
	(value: T): any
}
export interface SignalSubscriptionOptions {
	mode: "normal" | "once" | "immediate"
}

export interface SignalSetter<T> {
	(value: T, silent?: boolean): void
}

export interface SignalUpdater<T> {
	(set: SignalSetter<T>): SignalUpdaterCleaner
}

export interface SignalUpdaterCleaner {
	(): void
}

export function readable<T>(...params: ConstructorParameters<typeof SignalReadable<T>>) {
	return new SignalReadable<T>(...params)
}

export class SignalReadable<T = unknown> {
	public readonly id
	protected readonly _listeners: Set<SignalSubscriptionListener<any>>
	protected _value: T
	protected _updater: SignalUpdater<T> | null
	protected _cleaner: SignalUpdaterCleaner | null = null

	constructor(initial: T, updater: SignalUpdater<T> | null = null) {
		bindMethods(this)
		this.id = randomId()
		this._listeners = new Set()
		this._value = initial
		this._updater = updater
	}

	public get() {
		return this._value
	}

	public get ref() {
		return this.get()
	}

	protected checkActive() {
		if (!this._updater) return
		if (this._cleaner) {
			if (this._listeners.size > 0) return
			this._cleaner()
			this._cleaner = null
		} else {
			if (this._listeners.size === 0) return
			this._cleaner = this._updater((value, silent) => {
				this._value = value
				if (!silent) this.signal()
			})
		}
	}

	public subscribe(listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription {
		// xx console.log("%csubscribed", "color:orange", listener.name, "to", this.id)
		switch (options?.mode) {
			case "once":
				const onceCallback = () => {
					listener(this._value)
					this._listeners.delete(onceCallback)
				}
				this._listeners.add(onceCallback)
				break
			case "immediate":
				listener(this._value)
			case "normal":
			default:
				this._listeners.add(listener)
				break
		}
		this.checkActive()
		return {
			unsubscribe: () => {
				// xx console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				this._listeners.delete(listener)
				this.checkActive()
			},
		}
	}

	public signal() {
		// xx console.log("%csignaling", "color:yellow", this.id, this._value)
		this._listeners.forEach((callback) => {
			try {
				callback(this._value)
			} catch {}
		})
	}

	public async signalAsync() {
		// xx console.log("%csignaling async", "color:yellow", this.id, this._value)
		// Giving a size to the array is faster than using push
		const returns: Promise<unknown>[] = new Array(this._listeners.size)
		let i = 0
		this._listeners.forEach((callback) => {
			try {
				returns[i++] = callback(this._value)
			} catch {}
		})
		await Promise.all(returns)
	}
}
