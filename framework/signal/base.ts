import { randomId } from "../../utils/id"
import type { SignalDerived } from "./computed"

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

// TODO: try to make signals work with compute without providing updaters manually
// use static on going compute value or something like that that can support nesting and stuff
// Ok did it but it might have race problems maybe idk, haven't tried it much yet and looked into it that much 

export class Signal<T = any>
{
    protected static CurrentComputed: SignalDerived<any> | null = null

    public readonly id
    private _listeners: SignalListener<T>[]
    constructor(protected _value: T) 
    { 
        this.id = randomId()
        this._listeners = []
    }

    get() 
    {
        Signal.CurrentComputed?.addUpdater(this) 
        return this._value 
    }

    subscribe(listener: SignalListener<T>, options?: SignalSubscriptionOptions): SignalSubscription
    {
        switch (options?.mode)
        {
            case SignalSubscriptionMode.Once:
                const onceCallback = () =>
                {
                    listener(this._value)
                    this._listeners = this._listeners.filter(l => l !== onceCallback)
                }
                this._listeners.push(onceCallback)
                break
            case SignalSubscriptionMode.Immediate:
                listener(this._value)
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

    // NOTE: This is async but it doesn't need to be awaited. if you await you await for the async listeners to finish thats all.
    // but if you dont await you only wait for the sync listeners to finish.
    async signal()
    {
        await Promise.all(this._listeners.map((listener) => listener(this._value)))
    }
}