import { Signal, SignalSubscription } from "./base"

export interface SignalDerive<T> { (): T }
export class SignalDerived<T> extends Signal<T>
{
    protected dependencySubscriptions: SignalSubscription[]
    protected dependencies: Set<Signal>
    protected compute: SignalDerive<T>

    constructor(compute: SignalDerive<T>)
    {
        super(null!)
        this.compute = compute
        this.dependencies = new Set()
        this.dependencySubscriptions = []
        this.activate()
    }

    addUpdater(updater: Signal)
    {
        if (this.dependencies.has(updater)) return
        console.log('%cadded updater', 'color:green', updater.id, 'to', this.id)
        this.dependencies.add(updater)
        this.dependencySubscriptions.push(updater.subscribe(async () => await this.signal()))
    }

    activate()
    {
        this.signal()
        this.dependencies.forEach(updater => this.dependencySubscriptions.push(updater.subscribe(async () => await this.signal())))
    }
    deactivate()
    {
        if (!this.dependencySubscriptions.length) return
        this.dependencySubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.dependencySubscriptions = []
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