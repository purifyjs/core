import { bindClassMethods } from "../utils/bind"
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

export function createReadable<T>(...params: ConstructorParameters<typeof SignalReadable<T>>) {
	return new SignalReadable<T>(...params)
}

export class SignalReadable<T = any> {
	public readonly id
	protected readonly _listeners: Set<SignalSubscriptionListener<any>>
	protected _value: T

	constructor(value: T) {
		this.id = randomId()
		this._listeners = new Set()
		this._value = value
		bindClassMethods(this)
	}

	public get() {
		return this._value
	}

	public get value() {
		return this.get()
	}

	public subscribe(listener: SignalSubscriptionListener<T>, options?: SignalSubscriptionOptions): SignalSubscription {
		console.log("%csubscribed", "color:orange", listener.name, "to", this.id)
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
		return {
			unsubscribe: () => {
				console.log("%cunsubscribed", "color:orange", listener.name, "from", this.id)
				this._listeners.delete(listener)
			},
		}
	}

	public signal() {
		console.log("%csignaling", "color:yellow", this.id, this._value)
		this._listeners.forEach((callback) => {
			try {
				callback(this._value)
			} catch {}
		})
	}

	public async signalAsync() {
		console.log("%csignaling async", "color:yellow", this.id, this._value)
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
