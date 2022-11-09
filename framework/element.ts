import { randomId } from "../utils/id"
import { onNodeUnmount } from "../utils/node"
import { signal, Signal, SignalDerivation, signalDerive, SignalListener, signalText } from "./signal"
import type { MasterTemplate } from "./template"

export type MasterElementCallback = () => Promise<void> | void
export type MasterElementProps = { [key: string]: any }
export type MasterElementTemplate<Props extends MasterElementProps> = (params: { props: Props, self: MasterElement<Props> }) => MasterTemplate

export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    public static readonly globalFragment: DocumentFragment = document.createDocumentFragment()

    private $_debugId: string = randomId()
    private $_mountCallbacks: MasterElementCallback[] = []
    private $_unmountCallbacks: MasterElementCallback[] = []
    private $_mounted = false
    private $_initialized = false

    constructor(protected $: { props: Props, elementTemplate: MasterElementTemplate<Props> })
    {
        super()
    }

    private $_callbackQueue: MasterElementCallback[] = []
    private $_callbackQueueRunning = false
    private async $_emitCallbacks(callbacks: MasterElementCallback[])
    {
        this.$_callbackQueue.push(...callbacks)
        if (this.$_callbackQueueRunning) return
        this.$_callbackQueueRunning = true
        while (this.$_callbackQueue.length > 0)
        {
            const callback = this.$_callbackQueue.shift()!
            await callback()
        }
        this.$_callbackQueueRunning = false
    }

    get $mounted() { return this.$_mounted }

    // I made it as safe as possible to but I might have missed something
    // Somewhere around here there might be a race condition about mounting and unmounting
    // TODO: Fix this if it becomes a problem
    async $mount(mountPoint?: Element)
    {
        mountPoint?.replaceWith(this)
        if (this.$_mounted) return console.warn('Element is already mounted', this)
        console.log('Mounting element', this, 'at', this.parentNode, this.$_debugId)
        this.$_mounted = true

        await this.$_emitCallbacks(this.$_mountCallbacks)
        this.$_mountCallbacks = []

        if (!this.$_initialized) await this.$_init()

        onNodeUnmount(this, async () =>
        {
            if (!this.$_mounted) throw new Error('Cannot unmount element that is not mounted')
            console.log('Unmounting element', this, this.$_debugId)
            this.$_mounted = false
            await this.$_emitCallbacks(this.$_unmountCallbacks)
            this.$_unmountCallbacks = []
        })
    }

    private async $_init()
    {
        if (this.$_initialized) throw new Error('Cannot initialize element twice')
        this.$_initialized = true

        console.log('Initializing element', this, this.$_debugId)

        const template = this.$.elementTemplate({ props: this.$.props, self: this })
        const templateFragment = await template.renderFragment()

        const shadowRoot = this.attachShadow({ mode: 'open' })
        if (MasterElement.globalFragment) shadowRoot.append(MasterElement.globalFragment.cloneNode(true))
        shadowRoot.append(templateFragment)

        this.$ = null!
    }

    async $onMount<T extends MasterElementCallback>(callback: T) 
    {
        if (this.$_mounted) return await new Promise(async (resolve) => this.$_emitCallbacks([() => resolve(callback())])) 
        else return await new Promise((resolve) => this.$_mountCallbacks.push(() => resolve(callback())))
    }

    async $onUnmount(callback: MasterElementCallback)
    {
        if (!this.$_mounted && this.$_initialized) return await new Promise(async (resolve) => this.$_emitCallbacks([() => resolve(callback())])) 
        else return await new Promise((resolve) => this.$_unmountCallbacks.push(() => resolve(callback())))
    }

    $signal<T>(value: T)
    {
        return signal(value)
    }

    $subscribe<T>(signal: Signal<T>, callback: SignalListener<T>)
    {
        let subscription = signal.subscribe(callback)
        this.$onUnmount(() => subscription.unsubscribe())
        return subscription
    }

    $signalDerive<T>(getter: SignalDerivation<T>, ...triggerSignals: Signal[])
    {
        let signal = signalDerive(getter, ...triggerSignals)
        this.$onUnmount(() => signal.cleanup())
        return signal
    }

    $derive<T, U>(signal: Signal<T>, getter: (value: T) => U)
    {
        return this.$signalDerive(() => getter(signal.value), signal)
    }

    $text(parts: TemplateStringsArray, ...values: any[])
    {
        let signal = signalText(parts, ...values)
        this.$onUnmount(() => signal.cleanup())
        return signal
    }

    $interval(callback: () => void, interval: number)
    {
        let intervalId = window.setInterval(callback, interval)
        this.$onUnmount(() => window.clearInterval(intervalId))
        return intervalId
    }

    $timeout(callback: () => void, timeout: number)
    {
        let timeoutId = window.setTimeout(callback, timeout)
        this.$onUnmount(() => window.clearTimeout(timeoutId))
        return timeoutId
    }
}

export function defineElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> { }
    customElements.define(tag, Element)
    return (props: Props) => new Element({ props, elementTemplate })
}
