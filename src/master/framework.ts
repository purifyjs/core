import { randomId } from './utils/id'
import type { Template } from './template'

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
export type ElementDestroyCallback = ({ element }: { element: HTMLElement }) => Promise<void> | void
export type ElementProps = { [key: string]: any }
export type ElementTemplate<Props extends ElementProps> = (params: { props: Props, element: MasterElement<Props> }) => Template

export abstract class MasterElement<Props extends ElementProps = ElementProps> extends HTMLElement
{
    private $_mountCallbacks: ElementMountCallback[] = []
    private $_destroyCallbacks: ElementDestroyCallback[] = []
    private $_mounted = false
    private $_destroyed = false

    constructor(
        protected _mountParams: { props: Props, template: ElementTemplate<Props>, slot?: Template },
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

        const template = this._mountParams.template({ props: this._mountParams.props, element: this })

        mountPoint.replaceWith(this)
        const shadowRoot = this.attachShadow({ mode: 'open' })
        shadowRoot.querySelectorAll('style[\\:global]').forEach((style) => this.append(style))
        await template.$mount(shadowRoot, true)
        await this._mountParams.slot?.$mount(this, true)

        onNodeDestroy(this, () => this.$destroy())

        this._mountParams = null!
    }

    async $destroy()
    {
        if (!this.$_mounted) throw new Error('Cannot destroy element that is not mounted')
        if (this.$_destroyed) throw new Error('Cannot destroy element that is already destroyed')
        this.$_mounted = false
        this.$_destroyed = true
        for (const callback of this.$_destroyCallbacks)
        {
            await callback({ element: this })
        }
    }

    $onMount(callback: ElementMountCallback)
    {
        this.$_mountCallbacks.push(callback)
        if (this.$_mounted) callback({ element: this })
    }

    $onDestroy(callback: ElementDestroyCallback)
    {
        this.$_destroyCallbacks.push(callback)
    }
}

export function defineElement<Props extends ElementProps>(tag: string, template: ElementTemplate<Props>)
{
    const Element = class extends MasterElement<Props>
    {
        public static typeId = randomId()

        constructor(params: typeof Element.prototype._mountParams)
        {
            super(params)
        }

        async $mount(parent: HTMLElement): Promise<void>
        {
            this.classList.add('master-element', `m${Element.typeId}`)
            await super.$mount(parent)
        }
    }

    customElements.define(tag, Element)

    return (props: Props, slot?: Template) => new Element({ props, template, slot })
}

export type FragmentMountCallback = ({ mountPoint }: { mountPoint: Element }) => Promise<void> | void
export type FragmentDestroyCallback = () => Promise<void> | void
export type FragmentTemplate<Props extends ElementProps> = (params: { props: Props, onMount(callback: FragmentMountCallback): void, onDestroy(callback: FragmentDestroyCallback): void }) => Template

export function defineFragment<Props extends ElementProps>(fragmentTemplate: FragmentTemplate<Props>)
{
    const typeId = randomId()

    return (props: Props, slot?: Template) =>
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

        template.querySelectorAll('*:not(style):not(script)').forEach((element) => element.classList.add('master-fragment', `m${typeId}`))
        template.querySelectorAll('style:not([\\:global])').forEach((style) =>
        {
            style.textContent = scopeCss(style.textContent ?? '', `.m${typeId}`)
        })

        const templateMountCache = template.$mount
        Object.defineProperty(template, '$mount', {
            value: async (mountPoint: Element) =>
            {
                await templateMountCache.call(template, mountPoint)

                for (const callback of mountCallbacks)
                    await callback({ mountPoint })

                if (slot)
                {
                    const mountPoint = template.querySelector('slot')
                    if (mountPoint) await slot.$mount(mountPoint)
                }

                onNodeDestroy(startComment, async () =>
                {
                    for (const callback of destroyCallbacks)
                        await callback()
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