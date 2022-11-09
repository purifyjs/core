import { onNodeUnmount } from "../utils/node"
import { signal, Signal, SignalDerivation, signalDerive, SignalListener, signalText } from "./signal"
import type { MasterTemplate } from "./template"

export type MasterElementCallback = () => Promise<void> | void
export type MasterElementProps = { [key: string]: any }
export type MasterElementTemplate<Props extends MasterElementProps> = (params: { props: Props, self: MasterElement<Props> }) => Promise<MasterTemplate> | MasterTemplate

export function defineElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> { }
    customElements.define(tag, Element)
    return (props: Props) => new Element({ props, elementTemplate })
}


export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    public static readonly globalFragment: DocumentFragment = document.createDocumentFragment()

    private $_mountCallbacks: MasterElementCallback[] = []
    private $_unmountCallbacks: MasterElementCallback[] = []
    private $_mounted = false
    private $_initialized = false

    constructor(protected $: { props: Props, elementTemplate: MasterElementTemplate<Props> })
    {
        super()
    }

    get $mounted() { return this.$_mounted }
    get $initialized() { return this.$_initialized }

    async $mount(mountPoint?: Element)
    {
        mountPoint?.replaceWith(this)
        if (this.$_mounted) return console.warn('Element is already mounted', this)

        if (!this.$_initialized) await this.$_init()

        await Promise.all(this.$_mountCallbacks.map(callback => callback()))
        this.$_mountCallbacks = []

        onNodeUnmount(this, async () =>
        {
            if (!this.$_mounted) throw new Error('Cannot unmount element that is not mounted')
            this.$_mounted = false
            await Promise.all(this.$_unmountCallbacks.map(callback => callback()))
            this.$_unmountCallbacks = []
        })
        this.$_mounted = true
    }

    private async $_init()
    {
        if (this.$_initialized) throw new Error('Cannot initialize element twice')
        this.$_initialized = true

        const template = await this.$.elementTemplate({ props: this.$.props, self: this })
        const templateFragment = await template.renderFragment()

        const shadowRoot = this.attachShadow({ mode: 'open' })
        shadowRoot.append(MasterElement.globalFragment.cloneNode(true))
        shadowRoot.append(templateFragment)

        this.$ = null!
    }

    async $onMount<T extends MasterElementCallback>(callback: T): Promise<void>
    {
        if (this.$_mounted) await callback()
        await new Promise<void>(resolve => this.$_mountCallbacks.push(async () => { await callback(); resolve() }))
    }

    async $onUnmount(callback: MasterElementCallback): Promise<void>
    {
        if (!this.$_mounted) return
        await new Promise(resolve => this.$_unmountCallbacks.push(() => resolve(callback())))
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