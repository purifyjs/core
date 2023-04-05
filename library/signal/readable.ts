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
	(set: SignalSetter<T>, signal: SignalReadable<T>["signal"]): Function
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
			this._activate()
			setTimeout(() => this._checkActive(), 5000)
		}
		SignalReadable._SyncContext[SignalReadable._SyncContext.length - 1]?.add(this as never)
		return this._value
	}

	public get ref() {
		return this.get()
	}

	protected readonly _checkActive = () => {
		if (this._listeners.size) this._activate()
		else this._deactivate()
	}

	private _active = false

	protected readonly _set: SignalSetter<T> = (value, silent) => {
		if (value === this._value) return
		this._value = value
		if (!silent) this.signal()
	}

	protected readonly _activate = () => {
		if (this._active) return
		if (!this._updater) return
		if (this._cleaner) return
		this._active = true
		this._cleaner = this._updater(this._set, this.signal)
		// xx console.log("%cactivated", "color:yellow", this.id, this._value)
	}

	protected readonly _deactivate = () => {
		if (!this._active) return
		if (!this._updater) return
		if (!this._cleaner) return
		this._active = false
		this._cleaner()
		this._cleaner = null
		// xx console.log("%cdeactivated", "color:yellow", this.id, this._value)
	}

	public readonly subscribe = (listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription => {
		// xx console.log("%csubscribed", "color:orange", listener.name, "to", this.id)
		switch (options?.mode) {
			case "once":
				const onceCallback = () => {
					listener(this.ref)
					this._listeners.delete(onceCallback)
				}
				this._listeners.add(onceCallback)
				break
			case "immediate":
				listener(this.ref)
			case "normal":
			default:
				this._listeners.add(listener)
				break
		}
		this._checkActive()
		return {
			unsubscribe: () => {
				// xx console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				this._listeners.delete(listener)
				this._checkActive()
			},
		}
	}

	public readonly signal = () => {
		// xx console.log("%csignaling", "color:yellow", this.id, this._value)
		this._listeners.forEach((callback) => {
			try {
				callback(this.ref)
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
				const r = callback(this.ref)
				if (r instanceof Promise) returns[i++] = r
			} catch {}
		})
		await Promise.all(returns)
	}
}
