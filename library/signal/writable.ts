import { SignalReadable } from "./readable"

export function createWritable<T>(...params: ConstructorParameters<typeof SignalWritable<T>>) {
	return new SignalWritable<T>(...params)
}

export class SignalWritable<T> extends SignalReadable<T> {
	constructor(value: T) {
		super(value)
	}

	public set(value: T) {
		this._set(value)
	}

	public override set ref(value: T) {
		this.set(value)
	}

	public override get ref() {
		return super.ref
	}
}
