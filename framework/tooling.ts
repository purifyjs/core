import { signal, Signal, SignalDerivation, signalDerive, SignalListener, SignalOptions, SignalSubscription, signalText } from "./signal"

export type MasterToolingCallback = () => void

export function masterNodeTooling(node: Node)
{
    return new MasterNodeTooling(node)
}

export class MasterNodeTooling
{
    protected readonly _node: Node
    protected _mounted: boolean | null

    constructor(node: Node)
    {
        this._node = node
        this._mounted = null
        node = null!
        this._listenForMount()

        this.onMount(() => console.log('mounted', this._node))
        this.onUnmount(() => console.log('unmounted', this._node))
    }

    private async _listenForMount()
    {
        while (true)
        {
            const isMounted = MasterNodeTooling._getRootNode(this._node) !== null
            
            if (isMounted && !this._mounted)
            {
                this._mounted = true
                for (const callback of this._onMountCallbacks) callback()
            }
            else if (!isMounted && this._mounted)
            {
                this._mounted = false
                for (const callback of this._onUnmountCallbacks) callback()
                break
            }
           
            await new Promise((resolve) => requestAnimationFrame(resolve))
        }
    }

    protected static _getRootNode(node: Node): null | Node
    {
        if (node === document) return node
        if (node instanceof ShadowRoot) return this._getRootNode(node.host)
        if (node.parentNode) return this._getRootNode(node.parentNode)
        return null
    }

    get mounted() { return !!this._mounted }
    get node() { return this._node }

    protected readonly _onMountCallbacks: MasterToolingCallback[] = []
    onMount<T extends MasterToolingCallback>(callback: T)
    {
        if (this._mounted) callback()
        else this._onMountCallbacks.push(callback)
    }

    protected readonly _onUnmountCallbacks: MasterToolingCallback[] = []
    onUnmount(callback: MasterToolingCallback)
    {
        if (!this._mounted === false) callback()
        else this._onUnmountCallbacks.push(callback)
    }

    signal<T>(value: T)
    {
        return signal(value)
    }

    subscribe<T>(signal: Signal<T>, callback: SignalListener<T>, options?: SignalOptions)
    {
        let subscription: SignalSubscription
        this.onMount(() => subscription = signal.subscribe(callback, options))
        this.onUnmount(() => subscription.unsubscribe())
    }

    signalDerive<T>(getter: SignalDerivation<T>, ...triggerSignals: Signal[])
    {
        let signal = signalDerive(getter, ...triggerSignals)
        this.onMount(() => signal.activate())
        this.onUnmount(() => signal.deactivate())
        return signal
    }

    derive<T, U>(signal: Signal<T>, getter: (value: T) => U)
    {
        return this.signalDerive(() => getter(signal.value), signal)
    }

    text(parts: TemplateStringsArray, ...values: any[])
    {
        let signal = signalText(parts, ...values)
        this.onMount(() => signal.activate())
        this.onUnmount(() => signal.deactivate())
        return signal
    }

    interval(callback: () => void, interval: number)
    {
        let intervalId: number
        this.onMount(() => intervalId = setInterval(callback, interval))
        this.onUnmount(() => clearInterval(intervalId))
    }

    timeout(callback: () => void, timeout: number)
    {
        let timeoutId: number
        this.onMount(() => timeoutId = setTimeout(callback, timeout))
        this.onUnmount(() => clearTimeout(timeoutId))
    }
}