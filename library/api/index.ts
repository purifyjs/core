import type { Signal, SignalListener, SignalSubscription, SignalSubscriptionOptions } from "../signal/base"
import { SignalDerive, SignalDerived } from "../signal/derived"
import { SignalSettable } from "../signal/settable"
import "./mutationObserver"

export interface NodeWithMasterAPI extends Node
{
    $masterAPI?: MasterAPI
}

export function injectOrGetMasterAPI(node: NodeWithMasterAPI)
{
    return node.$masterAPI ?? new MasterAPI(node)
}

export class MasterAPI
{
    protected _mounted: boolean | null = null
    protected _node: NodeWithMasterAPI
    /**
     * The node that this API is attached to.
    **/
    get node() { return this._node }

    constructor(node: NodeWithMasterAPI)
    {
        if (node.$masterAPI) throw new Error('Node already has ')
        this._node = node
        node.$masterAPI = this

        this.onMount(() => console.log('%cmounted', 'color:red;font-weight:bold;font-size:12px', (node as Element).tagName || node.nodeValue || node.nodeName))
        this.onUnmount(() => console.log('%cunmounted', 'color:blue;font-weight:bold;font-size:12px', (node as Element).tagName || node.nodeValue || node.nodeName))
    }

    public emitMount()
    {
        if (this._mounted) return
        this._mounted = true
        this._mountListeners.forEach(listener => listener())
    }

    public emitUnmount()
    {
        if (!this._mounted) return
        this._mounted = false
        this._unmountListeners.forEach(listener => listener())
    }

    /**
     * Whether the node is mounted.
     * 
     * This is set to true when the node is mounted and false when the node is unmounted.
     * 
     * This is null when the node is never mounted.
    **/
    get mounted() { return this._mounted }

    protected readonly _mountListeners: Function[] = []
    /**
     * @param callback The callback to call when the node is mounted.
     * @example
     * m.onMount(() => console.log('mounted'))
     */
    onMount<T extends Function>(callback: T)
    {
        if (this._mounted) callback()
        else this._mountListeners.push(callback)
    }

    protected readonly _unmountListeners: Function[] = []
    /**
     * @param callback The callback to call when the node is unmounted.
     * @example
     * m.onUnmount(() => console.log('unmounted'))
    **/
    onUnmount(callback: Function)
    {
        if (this._mounted === false) callback()
        else this._unmountListeners.push(callback)
    }

    /**
     * Creates a settable signal.
     * @param value The initial value of the signal.
     * @returns The settable signal.
     * @example
     * const fooSignal = m.signal(0)
    **/
    signal<T>(...params: ConstructorParameters<typeof SignalSettable<T>>)
    {
        return new SignalSettable(...params)
    }

    /**
     * Subscribes to a signal.
     * 
     * Which is automatically unsubscribed when the node is unmounted and subscribed when the node is mounted again.
     * @param signal The signal to subscribe to.
     * @param callback The callback to call when the signal is signaled.
     * @param options The options to use when subscribing to the signal.
     * @example
     * m.subscribe(fooSignal, () => console.log('foo signaled'))
    **/
    subscribe<T>(signal: Signal<T>, callback: SignalListener<T>, options?: SignalSubscriptionOptions)
    {
        let subscription: SignalSubscription
        this.onMount(() => subscription = signal.subscribe(callback, options))
        this.onUnmount(() => subscription.unsubscribe())
    }

    /**
     * Derives a signal from a function.
     * 
     * Which is automatically activated and deactivated when the node is mounted and unmounted.
     * @param derive The function that derives the value of the signal.
     * @param dependencies The dependencies of the signal. When dependencies are signaled, derive is called again.
     * @returns The signal that is derived from the function.
     * @example
     * const double = m.derive(($) => $(foo).value * 2)
     * @example
     * const double = m.derive(() => foo.value * 2, [foo])
    **/
    derive<T>(...params: ConstructorParameters<typeof SignalDerived<T>>)
    {
        const computed = new SignalDerived(...params)
        this.onMount(() => computed.activate())
        this.onUnmount(() => computed.deactivate())
        return computed
    }

    protected _deriveFromFunctionCache = new WeakMap<SignalDerive<any>, SignalDerived<any>>()
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
    deriveFromFunction<T>(func: SignalDerive<T>): SignalDerived<T>
    {
        if (this._deriveFromFunctionCache.has(func)) return this._deriveFromFunctionCache.get(func)!
        const computed = new SignalDerived(func)
        this.onMount(() => computed.activate())
        this.onUnmount(() => computed.deactivate())
        this._deriveFromFunctionCache.set(func, computed)
        return computed
    }

    /**
     * Derives a signal from a promise.
     * 
     * When the promise is resolved, the signal is set to the resolved value.
     * @param then The promise to derive the signal from.
     * @param placeholder The value to set the signal to while the promise is pending.
     * @returns The signal that is derived from the promise.
     * @example
     * const signal = m.await(AsyncFooComponent(), 'loading') 
    **/
    await<T, P>(then: Promise<T>, placeholder: P)
    {
        const signal = this.signal<T | P>(placeholder)
        then.then(value => signal.set(value))
        return signal
    }

    /**
     * Same as setInterval, but automatically cleared when the node is unmounted and set again when the node is mounted again.
     * 
     * If node is never mounted, the interval is never set.
     * @param callback The callback to call every interval.
     * @param interval The interval in milliseconds.
     * @returns The interval id.
     * @example
     * m.interval(() => console.log('interval'), 1000)
    **/
    interval(callback: () => void, interval: number)
    {
        let intervalId: number
        this.onMount(() => intervalId = setInterval(callback, interval))
        this.onUnmount(() => clearInterval(intervalId))
    }

    /**
     * Same as setTimeout, but automatically cleared when the node is unmounted.
     * 
     * Sets a new timeout when the node is mounted again.
     * 
     * If node is never mounted, the timeout is never set.
     * @param callback The callback to call after the timeout.
     * @param timeout The timeout in milliseconds.
     * @returns The timeout id.
     * @example
     * m.timeout(() => console.log('timeout'), 1000)
    **/
    timeout(callback: () => void, timeout: number)
    {
        let timeoutId: number
        this.onMount(() => timeoutId = setTimeout(callback, timeout))
        this.onUnmount(() => clearTimeout(timeoutId))
    }
}