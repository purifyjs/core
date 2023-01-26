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

    protected active: boolean = false

    constructor(derive: SignalDerive<T>, ...dependencies: Signal[])
    {
        super(null!)
        this.derive = derive
        this.dependencies = new Set(dependencies)
        this.dependencySubscriptions = []
        this.activate()
        console.log('%cnew derived signal', 'color:purple', this.id)
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

    async activate()
    {
        if (this.active === true) return
        console.log('%cactivating', 'color:blue', this.id)

        this.active = true
        this.dependencies.forEach(updater => this.dependencySubscriptions.push(updater.subscribe(async () => await this.signal())))
        await this.signal()
    }
    deactivate()
    {
        if (this.active === false) return
        console.log('%cdeactivating', 'color:blue', this.id)

        this.active = false
        this.dependencySubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.dependencySubscriptions = []
    }

    protected version = 0
    async signal()
    {
        const versionCache = ++this.version
        const value = await this.derive(this.addDependency.bind(this))
        if (versionCache !== this.version) return
        if (value === this._value && typeof value !== 'object') return
        this._value = value

        console.log('%csignaling', 'color:orange', this.id, 'with', value, this.derive)
        await super.signal()
    }
}