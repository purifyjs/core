import { Signal } from "./base"
export interface SignalUpdater<T> { (value: T): T }
export interface SignalChanger<T> { (value: T): void }

export class SignalValue<T> extends Signal<T>
{
    protected static readonly Empty = Symbol('empty')

    async set(value: T | typeof SignalValue.Empty = SignalValue.Empty)
    {
        if (value === this.value && typeof value !== 'object') return
        if (value !== SignalValue.Empty) this._value = value
        await this.signal()
    }

    async change(changer: SignalChanger<T>)
    {
        changer(this.value)
        await this.signal()
    }

    async update(updater: SignalUpdater<T>)
    {
        await this.set(updater(this.value))
    }
}