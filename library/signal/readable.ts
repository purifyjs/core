import { randomId } from "../utils/id"

export type SignalSubscription = {
	unsubscribe(): void
}
export type SignalSubscriptionListener<T> = {
	(value: T): unknown
}
export type SignalSubscriptionOptions = {
	mode: "normal" | "once" | "immediate"
}

export type SignalSetter<T> = {
	(value: T, silent?: boolean): void
}

export type SignalUpdater<T> = {
	(set: SignalSetter<T>, initial: T, signal: () => void): Function
}

export function createReadable<T>(...params: ConstructorParameters<typeof SignalReadable<T>>) {
	return new SignalReadable<T>(...params)
}

export class SignalReadable<T = unknown> {
	public static _SyncContext: Set<SignalReadable>[] = []
	public readonly id
	protected readonly _listeners: Set<SignalSubscriptionListener<T>>
	protected _value: T
	protected _updater: SignalUpdater<T> | null
	protected _cleaner: Function | null = null

	constructor(initial: T, updater: SignalUpdater<T> | null = null) {
		this.id = randomId()
		this._listeners = new Set()
		this._value = initial
		this._updater = updater
	}

	public readonly get = () => {
		if (this._updater && !this._cleaner) {
			this.activate()
			setTimeout(() => this.checkActive(), 5000)
		}
		SignalReadable._SyncContext[SignalReadable._SyncContext.length - 1]?.add(this as never)
		return this._value
	}

	public get ref() {
		return this.get()
	}

	protected readonly checkActive = () => {
		if (this._listeners.size) this.activate()
		else this.deactivate()
	}

	private active = false

	protected readonly activate = () => {
		if (!this._updater) return
		if (this._cleaner) return
		if (this.active) throw new Error("WTF!")
		this.active = true
		this._cleaner = this._updater(
			(value, silent) => {
				this._value = value
				if (!silent) this.signal()
			},
			this._value,
			this.signal
		)
		// xx console.log("%cactivated", "color:yellow", this.id, this._value)
	}

	protected readonly deactivate = () => {
		if (!this._updater) return
		if (!this._cleaner) return
		if (!this.active) throw new Error("WTF!")
		this.active = false
		this._cleaner()
		this._cleaner = null
		// xx console.log("%cdeactivated", "color:yellow", this.id, this._value)
	}

	public readonly subscribe = (listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription => {
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

	public readonly signal = () => {
		// xx console.log("%csignaling", "color:yellow", this.id, this._value)
		this._listeners.forEach((callback) => {
			try {
				callback(this._value)
			} catch {}
		})
	}

	public readonly signalAsync = async () => {
		// xx console.log("%csignaling async", "color:yellow", this.id, this._value)
		// Giving a size to the array is faster than using push
		const returns: Promise<unknown>[] = new Array(this._listeners.size)
		let i = 0
		this._listeners.forEach((callback) => {
			try {
				const r = callback(this._value)
				if (r instanceof Promise) returns[i++] = r
			} catch {}
		})
		await Promise.all(returns)
	}
}
