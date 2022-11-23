import { Signal, SignalSubscription, SignalTickContext } from "./base"

export interface SignalDerive<T> { (): T }
export class SignalDerived<T> extends Signal<T> implements SignalTickContext
{
    protected dependencySubscriptions: SignalSubscription[]
    protected dependencies: Set<Signal>
    protected derive: SignalDerive<T>

    constructor(derive: SignalDerive<T>)
    {
        super(null!)
        this.derive = derive
        this.dependencies = new Set()
        this.dependencySubscriptions = []
        this.activate()
    }

    addDependency(dependency: Signal)
    {
        if (this.dependencies.has(dependency)) return
        console.log('%cadded dependency', 'color:green', dependency.id, 'to', this.id)
        this.dependencies.add(dependency)
        this.dependencySubscriptions.push(dependency.subscribe(async () => await this.signal()))
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
        const CurrentComputeCache = Signal.Context
        Signal.Context = this
        const value = this.derive()
        Signal.Context = CurrentComputeCache

        if (value === this._value && typeof value !== 'object') return
        this._value = value
        await super.signal()
    }
}