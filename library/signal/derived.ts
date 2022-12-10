import { Signal, SignalSubscription } from "./base"

export interface SignalDependencyAdder
{
    <T extends Signal>(signal: T): T
}
export interface SignalDerive<T> { (addDependency: SignalDependencyAdder): T }
export class SignalDerived<T> extends Signal<T>
{
    protected dependencySubscriptions: SignalSubscription[]
    protected dependencies: Set<Signal>
    protected derive: SignalDerive<T>

    constructor(derive: SignalDerive<T>, ...dependencies: Signal[])
    {
        super(null!)
        this.derive = derive
        this.dependencies = new Set(dependencies)
        this.dependencySubscriptions = []
        this.activate()
    }

    addDependency: SignalDependencyAdder = (dependency) =>
    {
        if (!this.dependencies.has(dependency))
        {
            console.log('%cadded dependency', 'color:green', dependency.id, 'to', this.id)
            this.dependencies.add(dependency)
            this.dependencySubscriptions.push(dependency.subscribe(async () => await this.signal()))
        }
        return dependency
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
        const value = this.derive(this.addDependency.bind(this))
        if (value === this._value && typeof value !== 'object') return
        this._value = value
        await super.signal()
    }
}