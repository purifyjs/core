import { Signal, SignalSubscription } from "./base"

export interface SignalCompute<T> { (): T }
export class SignalComputed<T> extends Signal<T>
{
    private updaterSubscriptions: SignalSubscription[]
    private updaters: Signal[]
    protected compute: SignalCompute<T>

    constructor(compute: SignalCompute<T>, ...updaters: Signal[])
    {
        super(compute())
        this.compute = compute
        this.updaters = updaters
        this.updaterSubscriptions = []
        this.activate()
    }

    activate()
    {
        if (this.updaterSubscriptions.length) return
        this.updaterSubscriptions = this.updaters.map((signal) => 
        {
            if (!(signal instanceof Signal)) throw new Error(`SignalComputed can only be created from Signal instances. Got ${signal}`)
            return signal.subscribe(async () => await this.signal())
        })
    }

    deactivate()
    {
        if (!this.updaterSubscriptions.length) return
        this.updaterSubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.updaterSubscriptions = []
    }

    async signal()
    {
        const value = this.compute()
        if (value === this.value && typeof value !== 'object') return
        this._value = value
        await super.signal()
    }
}