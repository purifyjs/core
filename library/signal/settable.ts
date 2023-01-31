import { Signal } from "./base"
export interface SignalChanger<T> { (value: T): void }

export function createSignal<T>(...params: ConstructorParameters<typeof SignalSettable<T>>)
{
    return new SignalSettable<T>(...params)
}

export class SignalSettable<T> extends Signal<T>
{
    protected static readonly Empty = Symbol('empty')

    public override get value() { return super.value }
    public override set value(value: T) { this.set(value) }

    public set(value: T | typeof SignalSettable.Empty = SignalSettable.Empty)
    {
        if (value === this._value && typeof value !== 'object') return
        if (value !== SignalSettable.Empty) this._value = value
        this.signal()
    }

    public change(changer: SignalChanger<T>)
    {
        changer(this._value)
        this.signal()
    }
}