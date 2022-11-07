import { onNodeDestroy } from "../utils/node"
import { Signal, signal, signalDerive, SignalListener, textSignal } from "./signal"
import type { Template } from "./template"

export type ElementMountCallback = ({ element }: { element: HTMLElement }) => Promise<void> | void
export type ElementDestroyCallback = ({ element }: { element: HTMLElement }) => void
export type ElementProps = { [key: string]: any }
export type ElementTemplate<Props extends ElementProps> = (params: { props: Props, self: MasterElement<Props> }) => Template

export abstract class MasterElement<Props extends ElementProps = ElementProps> extends HTMLElement
{
    private $_mountCallbacks: ElementMountCallback[] = []
    private $_destroyCallbacks: ElementDestroyCallback[] = []
    private $_mounted = false
    private $_destroyed = false

    constructor(
        protected $_mountParams: { props: Props, template: ElementTemplate<Props> },
    )
    {
        super()
    }

    get $mounted() { return this.$_mounted }
    get $destroyed() { return this.$_destroyed }

    async $mount(mountPoint: Element)
    {
        console.log('mounting', this)

        if (this.$_mounted) throw new Error('Cannot mount element that is already mounted')
        if (this.$_destroyed) throw new Error('Cannot mount destroyed element')
        this.$_mounted = true

        for (const callback of this.$_mountCallbacks)
            await callback({ element: this })
        this.$_mountCallbacks = []

        const template = this.$_mountParams.template({ props: this.$_mountParams.props, self: this })

        template.querySelectorAll('style[\\:global]').forEach((style) => 
        {
            this.$_destroyCallbacks.push(() => style.remove())
            document.head.append(style)
        })

        mountPoint.replaceWith(this)
        const shadowRoot = this.attachShadow({ mode: 'open' })
        const templateOutlet = document.createComment('template outlet')
        shadowRoot.append(templateOutlet)
        await template.$mount(templateOutlet)

        onNodeDestroy(this, () =>
        {
            this.$_mounted = false
            this.$_destroyed = true
            for (const callback of this.$_destroyCallbacks)
                callback({ element: this })
            this.$_destroyCallbacks = []
        })

        this.$_mountParams = null!
    }

    $onMount(callback: ElementMountCallback)
    {
        if (this.$_mounted) callback({ element: this })
        else this.$_mountCallbacks.push(callback)
    }

    $onDestroy(callback: ElementDestroyCallback)
    {
        if (this.$_destroyed) callback({ element: this })
        else this.$_destroyCallbacks.push(callback)
    }

    $text(parts: TemplateStringsArray, ...values: any[])
    {
        const signal = textSignal(parts, ...values)
        this.$onDestroy(() => signal.cleanup())
        return signal
    }

    $signal<T>(value: T)
    {
        return signal(value)
    }

    $subscribe<T>(signal: Signal<T>, callback: SignalListener<T>)
    {
        const subscription = signal.subscribe(callback)
        this.$onDestroy(() => subscription.unsubscribe())
        return subscription
    }

    $signalDerive<T>(getter: () => T, ...triggerSignals: Signal[])
    {
        const signal = signalDerive(getter, ...triggerSignals)
        this.$onDestroy(() => signal.cleanup())
        return signal
    }

    $interval(callback: () => void, interval: number)
    {
        const id = setInterval(() => callback(), interval)
        this.$onDestroy(() => clearInterval(interval))
        return id
    }

    $timeout(callback: () => void, timeout: number)
    {
        const id = setTimeout(() => callback(), timeout)
        this.$onDestroy(() => clearTimeout(id))
        return id
    }
}

export function defineElement<Props extends ElementProps>(tag: string, template: ElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> { }
    customElements.define(tag, Element)
    return (props: Props) => new Element({ props, template })
}
