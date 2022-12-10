import { Signal } from "./base"
export interface SignalChanger<T> { (value: T): void }

export class SignalSettable<T> extends Signal<T>
{
    protected static readonly Empty = Symbol('empty')

    async set(value: T | typeof SignalSettable.Empty = SignalSettable.Empty)
    {
        if (value === this._value && typeof value !== 'object') return
        if (value !== SignalSettable.Empty) this._value = value
        await this.signal()
    }

    get value() { return super.value }
    set value(value: T) { this.set(value) }

    async change(changer: SignalChanger<T>)
    {
        changer(this._value)
        await this.signal()
    }
}