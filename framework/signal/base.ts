import { randomId } from "../../utils/id"

export interface SignalSubscription { unsubscribe(): void }
export interface SignalListener<T> { (value: T): any }
export interface SignalSubscriptionOptions
{
    mode: SignalSubscriptionMode
}
export const enum SignalSubscriptionMode
{
    Normal,
    Immediate,
    Once
}

export class Signal<T = any>
{
    public readonly id = randomId()
    private _listeners: SignalListener<T>[] = []
    constructor(protected _value: T) { }

    get value() { return this._value }

    subscribe(listener: SignalListener<T>, options?: SignalSubscriptionOptions): SignalSubscription
    {
        switch (options?.mode)
        {
            case SignalSubscriptionMode.Once:
                const onceCallback = () =>
                {
                    listener(this.value)
                    this._listeners = this._listeners.filter(l => l !== onceCallback)
                }
                this._listeners.push(onceCallback)
                break
            case SignalSubscriptionMode.Immediate:
                listener(this.value)
            case SignalSubscriptionMode.Normal:
            default:
                this._listeners.push(listener)
                break
        }
        return {
            unsubscribe: () =>
            {
                const index = this._listeners.indexOf(listener)
                if (index !== -1) this._listeners.splice(index, 1)
            }
        }
    }

    async signal()
    {
        await Promise.all(this._listeners.map((listener) => listener(this.value)))
    }
}