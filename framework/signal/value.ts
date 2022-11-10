import { Signal } from "./base"
export interface SignalUpdater<T> { (value: T): T }

export class SignalValue<T> extends Signal<T>
{
    async set(value: T | typeof SignalValue.Empty = SignalValue.Empty)
    {
        if (value === this.value && typeof value !== 'object') return
        if (value !== SignalValue.Empty) this._value = value
        await this.signal()
    }

    async update(updater: SignalUpdater<T>)
    {
        await this.set(updater(this.value))
    }
}