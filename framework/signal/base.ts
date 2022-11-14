import { randomId } from "../../utils/id"

export interface SignalSubscription { unsubscribe(): void }
export interface SignalListener<T> { (value: T): any }
export interface SignalSubscriptionOptions
{
    mode: 'normal' | 'once' | 'immediate'
}

export interface SignalTickContext
{
    addDependency(signal: Signal): void
}

export class Signal<T = any>
{
    protected static Context: SignalTickContext| null = null

    public readonly id
    private _listeners: SignalListener<T>[]
    constructor(protected _value: T) 
    { 
        this.id = randomId()
        this._listeners = []
    }

    get() 
    {
        (Signal.Context as any)?.addDependency(this) 
        return this._value 
    }

    get value() { return this.get() }

    subscribe(listener: SignalListener<T>, options?: SignalSubscriptionOptions): SignalSubscription
    {
        switch (options?.mode)
        {
            case 'once':
                const onceCallback = () =>
                {
                    listener(this._value)
                    this._listeners = this._listeners.filter(l => l !== onceCallback)
                }
                this._listeners.push(onceCallback)
                break
            case 'immediate':
                listener(this._value)
            case 'normal':
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