import { randomId } from "../utils/id"

export interface SignalSubscription { unsubscribe(): void }
export interface SignalSubscriberCallback<T> { (value: T): any }
export interface SignalSubscriptionOptions
{
    mode: 'normal' | 'once' | 'immediate'
}

export function createStaticSignal<T>(...params: ConstructorParameters<typeof Signal<T>>)
{
    return new Signal<T>(...params)
}

export class Signal<T = any>
{
    public readonly id
    protected _value: T
    protected _subscribersCallbacks: SignalSubscriberCallback<T>[]

    constructor(value: T) 
    {
        this.id = randomId()
        this._subscribersCallbacks = []
        this._value = value
    }

    public get() 
    {
        return this._value 
    }

    public get value() { return this.get() }

    public subscribe(listener: SignalSubscriberCallback<T>, options?: SignalSubscriptionOptions): SignalSubscription
    {
        console.log('%csubscribed', 'color:orange', listener.name, 'to', this.id)
        switch (options?.mode)
        {
            case 'once':
                const onceCallback = () =>
                {
                    listener(this._value)
                    this._subscribersCallbacks = this._subscribersCallbacks.filter(l => l !== onceCallback)
                }
                this._subscribersCallbacks.push(onceCallback)
                break
            case 'immediate':
                listener(this._value)
            case 'normal':
            default:
                this._subscribersCallbacks.push(listener)
                break
        }
        return {
            unsubscribe: () =>
            {
                console.log('%cunsubscribed', 'color:orange', listener.name, 'from', this.id)
                const index = this._subscribersCallbacks.indexOf(listener)
                if (index !== -1) this._subscribersCallbacks.splice(index, 1)
            }
        }
    }

    public signal()
    {
        console.log('%csignaling', 'color:yellow', this.id, this._value)
        for (const listener of this._subscribersCallbacks) listener(this._value)
    }
}