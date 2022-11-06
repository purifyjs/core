import { MasterElement, onNodeDestroy } from "./framework"
import { Signal } from "./signal"
import { randomId } from "./utils/id"

export type TemplateAccepts = any
function parseValue(value: TemplateAccepts): Node
{
    if (value instanceof HTMLElement)
        return value
    else if (value instanceof DocumentFragment)
        return value
    else
        return document.createTextNode(`${value}`)
}

export function html(parts: TemplateStringsArray, ...values: TemplateAccepts[])
{
    return new Template(parts, ...values)
}

export class Template extends DocumentFragment
{
    private readonly $_nodes: Node[] = []
    private readonly $_listeners: Record<string, EventListener> = {}
    private readonly $_signal_texts: Record<string, { signal: Signal, startNode: Node, endNode: Node }> = {}
    private readonly $_signal_attributes: Record<string, { signal: Signal, attribute: string }> = {}

    constructor(parts: TemplateStringsArray, ...values: TemplateAccepts[]) 
    {
        super()
        const htmlParts = parts.map((htmlPart, index) => 
        {
            const value: TemplateAccepts = values[index]
            if (value == null || value === undefined) return htmlPart
            if (htmlPart.trimEnd().endsWith('<x') && value instanceof MasterElement)
            {
                return `${htmlPart} x:element="${this.$_nodes.push(value) - 1}"`
            }
            else if (value instanceof Function)
            {
                // We use a random id to avoid collisions with fragments
                const id = randomId()
                this.$_listeners[id] = value
                return `${htmlPart}${id}`
            }
            if (htmlPart.endsWith('='))
            {
                if (value instanceof Signal)
                {
                    this.$_signal_attributes[value.id] = { signal: value, attribute: htmlPart.substring(htmlPart.lastIndexOf(' ') + 1).slice(0, -1) }
                    return `${htmlPart}"${value.id}"`
                }
                return `${htmlPart}"${value.toString().replaceAll('"', '\\"')}"`
            }
            else if (value instanceof Signal)
            {
                const fragment = document.createDocumentFragment()
                const comment = `signal ${value.id}`
                const startComment = document.createComment(comment)
                const endComment = document.createComment(`/${comment}`)

                const node = parseValue(value.value)
                fragment.append(startComment, node, endComment)

                this.$_signal_texts[value.id] = { signal: value, startNode: startComment, endNode: endComment }

                this.$_nodes.push(fragment)
            }
            else
            {
                this.$_nodes.push(parseValue(value))
            }

            index = this.$_nodes.length - 1
            return `${htmlPart}<x x:element="${index}"></x>`
        })

        const html = htmlParts.join('')

        const template = document.createElement('template')
        template.innerHTML = html

        this.append(...Array.from(template.content.childNodes))
    }

    async $mount(mountPoint: Element | ShadowRoot, append = false)
    {
        const root = mountPoint instanceof ShadowRoot ? mountPoint : mountPoint.parentElement
        if (!root) throw new Error('Cannot mount template to a node that is not attached to the DOM')

        const toMount = this.insertOutlets()
        
        if (append) mountPoint.append(this)
        else if (!mountPoint.parentNode) throw new Error('Cannot mount template to a node that is not attached to the DOM')
        else mountPoint.parentNode.replaceChild(this, mountPoint)
        
        await Promise.all(toMount.map(async ({ node, outlet }) => await node.$mount(outlet)))

        this.listenToEvents(root)
        this.subscribeToSignals(root)
        
    }

    private subscribeToSignals(root: Element | ShadowRoot)
    {
        for (const id in this.$_signal_texts)
        {
            const { signal, startNode, endNode } = this.$_signal_texts[id]
            const sub = signal.subscribe((value) =>
            {
                const newNode = parseValue(value)
                while (startNode.nextSibling !== endNode) startNode.nextSibling!.remove()
                if (!startNode.parentNode) throw new Error('Cannot replace node that is not attached to the DOM')
                startNode.parentNode.insertBefore(newNode, endNode)
            })
            onNodeDestroy(startNode, () => sub.unsubscribe())
        }

        for (const id in this.$_signal_attributes)
        {
            const { signal, attribute } = this.$_signal_attributes[id]
            const element = root.querySelector(`[${attribute}="${id}"]`)
            if (!element) throw new Error(`Cannot find element with attribute ${attribute}="${id}"`)
            element.setAttribute(attribute, signal.value.toString())
            const sub = signal.subscribe((value) => element.setAttribute(attribute, value.toString()))
            onNodeDestroy(element, () => sub.unsubscribe())
        }
    }

    private insertOutlets()
    {
        const toMount: { node: MasterElement | Template, outlet: Element }[] = []
        this.$_nodes.forEach((node, index) =>
        {
            const outlet = this.querySelector(`x[x\\:element="${index}"]`)
            if (!outlet) throw new Error(`No outlet found for node ${index}`)
            if (node instanceof MasterElement)
            {
                outlet.removeAttribute('x:element')
                for (const attribute of Array.from(outlet.attributes))
                    node.setAttribute(attribute.name, attribute.value)
            }
            if (node instanceof Template || node instanceof MasterElement)
                toMount.push({ node, outlet })
            else
                outlet.replaceWith(node)
        })

        return toMount
    }

    private listenToEvents(root: Element | ShadowRoot)
    {
        root.querySelectorAll('*').forEach((node) =>
        {
            Array.from(node.attributes).forEach((attribute) =>
            {
                if (attribute.name.startsWith('on:'))
                {
                    const listener = this.$_listeners[attribute.value]
                    if (!listener) return
                    const eventName = attribute.name.slice(3)
                    console.log('registering event', eventName, node)
                    node.addEventListener(eventName, listener)
                }
            })
        })
    }
}