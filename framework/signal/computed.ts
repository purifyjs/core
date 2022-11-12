import { Signal, SignalSubscription } from "./base"

export interface SignalCompute<T> { (): T }
export class SignalComputed<T> extends Signal<T>
{
    protected updaterSubscriptions: SignalSubscription[]
    protected updaters: Set<Signal>
    protected compute: SignalCompute<T>

    constructor(compute: SignalCompute<T>)
    {
        super(null!)
        this.compute = compute
        this.updaters = new Set()
        this.updaterSubscriptions = []
        this.activate()
    }

    addUpdater(updater: Signal)
    {
        if (this.updaters.has(updater)) return
        console.log('%cadded updater', 'color:green', updater.id, 'to', this.id)
        this.updaters.add(updater)
        this.updaterSubscriptions.push(updater.subscribe(async () => await this.signal()))
    }

    activate()
    {
        this.signal()
        this.updaters.forEach(updater => this.updaterSubscriptions.push(updater.subscribe(async () => await this.signal())))
    }
    deactivate()
    {
        if (!this.updaterSubscriptions.length) return
        this.updaterSubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.updaterSubscriptions = []
    }

    async signal()
    {
        const CurrentComputeCache = Signal.CurrentComputed
        Signal.CurrentComputed = this
        const value = this.compute()
        Signal.CurrentComputed = CurrentComputeCache

        if (value === this._value && typeof value !== 'object') return
        this._value = value
        await super.signal()
    }
}