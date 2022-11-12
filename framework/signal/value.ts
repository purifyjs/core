import { Signal } from "./base"
export interface SignalChanger<T> { (value: T): void }

export class SignalValue<T> extends Signal<T>
{
    protected static readonly Empty = Symbol('empty')

    async set(value: T | typeof SignalValue.Empty = SignalValue.Empty)
    {
        if (value === this._value && typeof value !== 'object') return
        if (value !== SignalValue.Empty) this._value = value
        await this.signal()
    }

    async change(changer: SignalChanger<T>)
    {
        changer(this._value)
        await this.signal()
    }
}