import { onNodeDestroy } from "../utils/node"
import { Signal, signal, signalDerive, SignalListener, textSignal } from "./signal"
import type { MasterFragment } from "./fragment"

export type MasterElementMountCallback = ({ element }: { element: HTMLElement }) => Promise<void> | void
export type MasterElementDestroyCallback = ({ element }: { element: HTMLElement }) => void
export type MasterElementProps = { [key: string]: any }
export type MasterElementTemplate<Props extends MasterElementProps> = (params: { props: Props, self: MasterElement<Props> }) => MasterFragment

export abstract class MasterElement<Props extends MasterElementProps = MasterElementProps> extends HTMLElement
{
    private $_mountCallbacks: MasterElementMountCallback[] = []
    private $_destroyCallbacks: MasterElementDestroyCallback[] = []
    private $_mounted = false
    private $_destroyed = false

    constructor(
        protected $_mountParams: { props: Props, elementTemplate: MasterElementTemplate<Props> },
    )
    {
        super()
    }

    get $mounted() { return this.$_mounted }
    get $destroyed() { return this.$_destroyed }

    async $mount(mountPoint?: Element)
    {
        console.log('mounting', this)

        if (this.$_mounted) throw new Error('Cannot mount element that is already mounted')
        if (this.$_destroyed) throw new Error('Cannot mount destroyed element')
        this.$_mounted = true

        for (const callback of this.$_mountCallbacks)
            await callback({ element: this })
        this.$_mountCallbacks = []

        const template = this.$_mountParams.elementTemplate({ props: this.$_mountParams.props, self: this })
        await template.$mount()

        mountPoint?.replaceWith(this)
        const shadowRoot = this.attachShadow({ mode: 'open' })
        shadowRoot.append(...template)

        shadowRoot.querySelectorAll('style[\\:global]').forEach((style) => 
        {
            this.$_destroyCallbacks.push(() => style.remove())
            document.head.append(style)
        })

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

    $onMount(callback: MasterElementMountCallback)
    {
        if (this.$_mounted) callback({ element: this })
        else this.$_mountCallbacks.push(callback)
    }

    $onDestroy(callback: MasterElementDestroyCallback)
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

export function defineElement<Props extends MasterElementProps>(tag: string, elementTemplate: MasterElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props> { }
    customElements.define(tag, Element)
    return (props: Props) => new Element({ props, elementTemplate })
}
