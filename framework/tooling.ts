import { signal, Signal, SignalDerivation, signalDerive, SignalListener, SignalOptions, SignalSubscription, signalText } from "./signal"

const mountUnmountObserver =  new MutationObserver((mutations) => 
{
    for (const mutation of mutations)
    {
        mutation.removedNodes.forEach(removedNode)
        mutation.addedNodes.forEach(addedNode)
    }
})
mountUnmountObserver.observe(document, { childList: true, subtree: true })
const originalAttachShadow = Element.prototype.attachShadow
Element.prototype.attachShadow = function (options: ShadowRootInit)
{
    const shadowRoot = originalAttachShadow.call(this, options)
    if (options.mode === 'open') mountUnmountObserver.observe(shadowRoot, { childList: true, subtree: true })
    return shadowRoot
}

function addedNode(node: MasterToolingNode)
{
    if (getRootNode(node) !== document) return
    node.$tooling?.emitMount()
    node.childNodes.forEach(addedNode)
    if (node instanceof Element) node.shadowRoot?.childNodes.forEach(addedNode)
}

function removedNode(node: MasterToolingNode)
{
    node.$tooling?.emitUnmount()
    node.childNodes.forEach(removedNode)
    if (node instanceof Element) node.shadowRoot?.childNodes.forEach(removedNode)
}

function getRootNode(node: Node): null | Node
{
    if (node === document) return node
    if (node instanceof ShadowRoot) return getRootNode(node.host)
    if (node.parentNode) return getRootNode(node.parentNode)
    return null
}

export interface MasterToolingListener
{
    (): void
}
export interface MasterToolingNode extends Node
{
    $tooling?: MasterTooling
}
export function masterTooling(node: Node)
{
    return new MasterTooling(node)
}

export class MasterTooling
{
    protected readonly _node: MasterToolingNode
    protected _mounted: boolean | null

    constructor(node: MasterToolingNode)
    {
        if (node.$tooling) throw new Error('Node already has tooling')
        this._node = node
        this._mounted = null
        this._node.$tooling = this

        this.onMount(() => console.log('%cmounted', 'color:red;font-weight:bold;font-size:12px', (this._node as Element).tagName || this._node.nodeValue || this._node.nodeName))
        this.onUnmount(() => console.log('%cunmounted', 'color:blue;font-weight:bold;font-size:12px', (this._node as Element).tagName || this._node.nodeValue || this._node.nodeName))
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

    get mounted() { return !!this._mounted }
    get node() { return this._node }

    protected readonly _mountListeners: MasterToolingListener[] = []
    onMount<T extends MasterToolingListener>(callback: T)
    {
        if (this._mounted) callback()
        else this._mountListeners.push(callback)
    }

    protected readonly _unmountListeners: MasterToolingListener[] = []
    onUnmount(callback: MasterToolingListener)
    {
        if (!this._mounted === false) callback()
        else this._unmountListeners.push(callback)
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

    await<T, P>(then: Promise<T>, placeholder: P): Signal<T | P>
    {
        let signal = this.signal<T | P>(placeholder)
        then.then(value => signal.set(value))
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