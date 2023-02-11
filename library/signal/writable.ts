import { SignalReadable, SignalSetter } from "./readable"

export function createWritable<T>(...params: ConstructorParameters<typeof SignalWritable<T>>) {
	return new SignalWritable<T>(...params)
}

interface ISignalWritable<T> extends SignalReadable<T> {
	set: SignalSetter<T>
	set ref(value: T)
	get ref(): T
}

export class SignalWritable<T> extends SignalReadable<T> implements ISignalWritable<T> {
	constructor(value: T) {
		super(value)
	}

	public set(value: T, silent = false) {
		if (value === this._value) return
		this._value = value
		if (!silent) this.signal()
	}

	public override set ref(value: T) {
		this.set(value)
	}

	public override get ref() {
		return super.ref
	}
}
