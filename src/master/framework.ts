import { Signal, signal, signalDerive, SignalListener, textSignal } from './signal'
import type { Template } from './template'
import { randomId } from './utils/id'

// This is bad but good enough for now for testing and development
// TODO: Find a better way to do this
export function onNodeDestroy(node: Node, callback: () => void)
{
    (async () =>
    {
        while (getRootNode(node) === document)
        {
            await new Promise((resolve) => requestAnimationFrame(resolve))
        }
        console.log('destroyed', node)
        callback()
    })()
}

function getRootNode(node: Node): Node
{
    if (node instanceof ShadowRoot) return getRootNode(node.host)
    if (node.parentNode) return getRootNode(node.parentNode)
    return node
}

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

export type FragmentMountCallback = ({ mountPoint }: { mountPoint: Element }) => Promise<void> | void
export type FragmentDestroyCallback = () => void
export type FragmentTemplate<Props extends ElementProps> = (params: { props: Props, onMount(callback: FragmentMountCallback): void, onDestroy(callback: FragmentDestroyCallback): void }) => Template

export function defineFragment<Props extends ElementProps>(fragmentTemplate: FragmentTemplate<Props>)
{
    const typeId = randomId()

    return (props: Props) =>
    {
        const comment = `fragment ${typeId}`
        const startComment = document.createComment(comment)
        const endComment = document.createComment(`/${comment}`)

        const mountCallbacks: FragmentMountCallback[] = []
        const destroyCallbacks: FragmentDestroyCallback[] = []

        const template = fragmentTemplate({
            props,
            onMount(callback) { mountCallbacks.push(callback) },
            onDestroy(callback) { destroyCallbacks.push(callback) },
        })

        template.prepend(startComment)
        template.append(endComment)

        template.querySelectorAll('*:not(style):not(script)').forEach((element) => element.classList.add(`f-${typeId}`))
        template.querySelectorAll('style:not([\\:global])').forEach((style) =>
        {
            style.textContent = scopeCss(style.textContent ?? '', `.f-${typeId}`)
        })

        const templateMountCache = template.$mount
        Object.defineProperty(template, '$mount', {
            value: async (mountPoint: Element) =>
            {
                await templateMountCache.call(template, mountPoint)

                for (const callback of mountCallbacks)
                    await callback({ mountPoint })

                onNodeDestroy(startComment, () =>
                {
                    for (const callback of destroyCallbacks) callback()
                })
            },
            writable: false
        })

        return template
    }
}

function scopeCss(css: string, scopeSelector: string): string
{
    const matches = css.matchAll(/(?<selector>[^{]+){(?<rules>[^}]+)}/g)
    const scopedCss = [...matches].map((match) =>
    {
        const selector = match.groups?.selector ?? ''
        const rules = match.groups?.rules ?? ''

        const selectors = selector.split(',').map((selector) =>
        {
            return scopeCssSelector(selector, scopeSelector)
        })
        return `${selectors.join(',')}{${rules}}`
    })
    return scopedCss.join('')
}
// \(([^\)]+)\)
function scopeCssSelector(selector: string, scopeSelector: string): string
{
    const combinators = [' ', '>', '+', '~']
    const parts = selector.split(/(?<combinator>[ >+~])/g).map((part) => part.trim()).filter((part) => part !== '')
    const scopedParts = parts.map((part) =>
    {
        if (combinators.includes(part)) return part

        const matches = part.matchAll(/\(([^()]+)\)/g)
        if (matches)
        {
            for (const match of matches)
            {
                if (!match.index) continue
                const scopedPart = scopeCssSelector(match[1], scopeSelector)
                const partArr = Array.from(part)
                partArr.splice(match.index, match[0].length, `(${scopedPart})`).join('')
                part = partArr.join('')
            }
        }

        return `${part}${scopeSelector}`
    })
    return scopedParts.join('')
}