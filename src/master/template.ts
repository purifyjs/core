import { MasterElement, onNodeDestroy } from "./framework"
import { Signal } from "./signal"

type TemplateAcceptsValue = HTMLElement | DocumentFragment | string | number | boolean | null | undefined | Date | EventListener
type TemplateAcceptsSignal = Signal<HTMLElement> | Signal<DocumentFragment> | Signal<string> | Signal<number> | Signal<boolean> | Signal<Date> | Signal<null> | Signal<undefined>
export type TemplateAccepts = TemplateAcceptsValue | TemplateAcceptsSignal
function parseValue(value: TemplateAcceptsValue): Node
{
    if (value instanceof HTMLElement)
    {
        return value
    }
    else if (value instanceof DocumentFragment)
    {
        return value
    }
    else if (value instanceof Date)
    {
        return document.createTextNode(value.toISOString())
    }
    else
    {
        return document.createTextNode(`${value}`)
    }
}

export function html(parts: TemplateStringsArray, ...values: TemplateAccepts[])
{
    return new Template(parts, ...values)
}

export class Template extends DocumentFragment
{
    private readonly $_nodes: Node[] = []
    private readonly $_listeners: EventListener[] = []
    private readonly $_signals: Record<string, { signal: Signal, startNode: Node, endNode: Node }> = {}

    constructor(parts: TemplateStringsArray, ...values: TemplateAccepts[]) 
    {
        super()
        const htmlParts = parts.map((htmlPart, index) => 
        {
            const value: TemplateAccepts = values[index]
            if (value == null || value === undefined) return htmlPart
            if (value instanceof Signal)
            {
                const fragment = document.createDocumentFragment()
                const comment = `signal ${value.id}`
                const startComment = document.createComment(comment)
                const endComment = document.createComment(`/${comment}`)

                const node = parseValue(value.value)
                fragment.append(startComment, node, endComment)

                this.$_signals[value.id] = { signal: value, startNode: startComment, endNode: endComment }

                this.$_nodes.push(fragment)
            }
            else if (value instanceof Function)
            {
                return `${htmlPart}${this.$_listeners.push(value) - 1}`
            }
            else
            {
                this.$_nodes.push(parseValue(value))
            }

            index = this.$_nodes.length - 1
            return `${htmlPart}<outlet-${index}></outlet-${index}>`
        })

        const html = htmlParts.join('')

        const template = document.createElement('template')
        template.innerHTML = html

        this.append(...Array.from(template.content.childNodes))
    }

    async $mount(mountPoint: Element | ShadowRoot, append = false)
    {
        const toMount = this.insertOutlets()
        this.listenToEvents()

        if (append) mountPoint.append(this)
        else if (!mountPoint.parentNode) throw new Error('Cannot mount template to a node that is not attached to the DOM')
        else mountPoint.parentNode.replaceChild(this, mountPoint)

        await Promise.all(toMount.map(async ({ node, outlet }) => await node.$mount(outlet)))
        this.subscribeToSignals()
    }

    private subscribeToSignals()
    {
        for (const id in this.$_signals)
        {
            const { signal, startNode, endNode } = this.$_signals[id]
            const sub = signal.subscribe((value) =>
            {
                const newNode = parseValue(value)
                while (startNode.nextSibling !== endNode) startNode.nextSibling!.remove()
                if (!startNode.parentNode) throw new Error('Cannot replace node that is not attached to the DOM')
                startNode.parentNode.insertBefore(newNode, endNode)
            })
            onNodeDestroy(startNode, () => sub.unsubscribe())
        }
    }

    private insertOutlets()
    {
        const toMount: { node: MasterElement | Template, outlet: Element }[] = []
        this.$_nodes.forEach((node, index) =>
        {
            const outlet = this.querySelector(`outlet-${index}`)
            if (!outlet) throw new Error(`No outlet found for node ${index}`)
            if (node instanceof Template || node instanceof MasterElement)
                toMount.push({ node, outlet })
            else
                outlet.replaceWith(node)
        })

        return toMount
    }

    private listenToEvents()
    {
        this.querySelectorAll('*').forEach((node) =>
        {
            Array.from(node.attributes).forEach((attribute) =>
            {
                if (attribute.name.startsWith('on:'))
                {
                    const eventName = attribute.name.slice(3)
                    node.addEventListener(eventName, this.$_listeners[parseInt(attribute.value)])
                }
            })
        })
    }
}