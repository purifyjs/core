import { Signal, SignalSubscription } from "./base"

export interface SignalDependencyAdder
{
    <T extends Signal>(signal: T): T
}
export interface SignalDeriver<T> { (addDependency: SignalDependencyAdder): T }

export function createDerive<T>(...params: ConstructorParameters<typeof SignalDerive<T>>)
{
    return new SignalDerive<T>(...params)
}

const deriveFromFunctionCache = new WeakMap<SignalDeriver<any>, SignalDerive<any>>()
/**
 * Same as derive, but specialized for functions.
 * 
 * Derives a signal from a function.
 * 
 * Cache is used to ensure that the same signal is returned for the same function.
 * 
 * Used internally to convert functions in html to derived signals.
 * @param func The function that derives the value of the signal.
 * @returns The signal that is derived from the function.
 * @example
 * const double = m.deriveFromFunction(($) => $(foo).value * 2)
**/
export function createDeriveFromFunction<T>(func: SignalDeriver<T>): SignalDerive<T>
{
    if (deriveFromFunctionCache.has(func)) return deriveFromFunctionCache.get(func)!
    const computed = createDerive(func)
    deriveFromFunctionCache.set(func, computed)
    return computed
}

export class SignalDerive<T> extends Signal<T>
{
    protected dependencySubscriptions: SignalSubscription[]
    protected dependencies: Set<Signal>
    protected deriver: SignalDeriver<T>

    protected active: boolean = false

    constructor(deriver: SignalDeriver<T>, ...dependencies: Signal[])
    {
        super(null!)
        this.deriver = deriver
        this.dependencies = new Set()
        this.dependencySubscriptions = []
        console.log('%cnew derived signal', 'color:purple', this.id)
        for (const dependency of dependencies) this.addDependency(dependency)
    }

    protected activate()
    {
        if (this.active === true) return
        console.log('%cactivating', 'color:blue', this.id, this.deriver)

        this.active = true
        this.dependencies.forEach(updater => this.dependencySubscriptions.push(updater.subscribe(() => this.signal())))
        this.signal()
    }
    protected deactivate()
    {
        if (this.active === false) return
        console.log('%cdeactivating', 'color:blue', this.id, this.deriver)

        this.active = false
        this.dependencySubscriptions.forEach((subscription) => subscription.unsubscribe())
        this.dependencySubscriptions = []
    }

    public get() 
    {
        if (this.active === false) this.signal()
        return super.get()
    }
    public get value() { return this.get() }

    protected addDependency: SignalDependencyAdder = (dependency) =>
    {
        if (!this.dependencies.has(dependency))
        {
            console.log('%cadded dependency', 'color:green', dependency.id, 'to', this.id)
            this.dependencies.add(dependency)
            this.dependencySubscriptions.push(dependency.subscribe(() => this.signal()))
        }
        return dependency
    }

    public subscribe(...params: Parameters<Signal<T>['subscribe']>): ReturnType<Signal<T>['subscribe']>
    {
        this.activate()
        const subscription = super.subscribe(...params)
        const superUnsubscribe = subscription.unsubscribe
        subscription.unsubscribe = () =>
        {
            superUnsubscribe()
            if (this._subscribersCallbacks.length === 0) this.deactivate()
        }
        return subscription
    }

    public signal()
    {
        const value = this.deriver(this.addDependency.bind(this))
        if (value === this._value && typeof value !== 'object') return
        this._value = value
        super.signal()
    }
}