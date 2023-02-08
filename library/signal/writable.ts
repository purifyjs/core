import { bindClassMethods } from "../utils/bind"
import { SignalReadable } from "./readable"
export interface SignalChanger<T> {
	(value: T): void
}

export function createWritable<T>(...params: ConstructorParameters<typeof SignalWritable<T>>) {
	return new SignalWritable<T>(...params)
}

export class SignalWritable<T> extends SignalReadable<T> {
	constructor(...params: ConstructorParameters<typeof SignalReadable<T>>) {
		super(...params)
		bindClassMethods(this)
	}

	public override get value() {
		return super.value
	}
	public override set value(value: T) {
		this.set(value)
	}

	public set(value: T) {
		this.setWithoutSignal(value)
		this.signal()
	}

	public setWithoutSignal(value: T) {
		this._value = value
	}
}
