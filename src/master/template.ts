import { MasterElement, onNodeDestroy } from "./framework"
import { Signal, signalDerive } from "./signal"
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

        const enum State
        {
            Outer,
            TagInner,
            TagName,
            TagClose,
            AttributeName,
            AttributeValueUnquoted,
            AttributeValueQuoted
        }

        const state = {
            current: State.Outer,
            tag: null as string | null,
            attribute_name: null as string | null,
            attribute_value: null as string | null
        }

        let html = ''
        for (let i = 0; i < parts.length; i++)
        {
            const part = parts[i]

            for (const char of part)
            {
                switch (state.current)
                {
                    case State.Outer:
                        if (char === '<')
                        {
                            state.current = State.TagName
                            state.tag = ''
                        }
                        break
                    case State.TagName:
                        if (!state.tag && char === '/')
                        {
                            state.current = State.TagClose
                            state.tag = ''
                        }
                        else if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                        }
                        else
                        {
                            state.tag += char
                        }
                        break
                    case State.TagInner:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                        }
                        else
                        {
                            state.current = State.AttributeName
                            state.attribute_name = char
                        }
                        break
                    case State.AttributeName:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                            state.attribute_name = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                        }
                        else if (char === '=')
                        {
                            state.current = State.AttributeValueUnquoted
                            state.attribute_value = ''
                        }
                        else
                        {
                            state.attribute_name += char
                        }
                        break
                    case State.AttributeValueUnquoted:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                            state.attribute_name = null
                            state.attribute_value = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_value = null
                        }
                        else if (char === '"')
                        {
                            state.current = State.AttributeValueQuoted
                            state.attribute_value = ''
                        }
                        else
                        {
                            state.attribute_value += char
                        }
                        break
                    case State.AttributeValueQuoted:
                        if (char === '"')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_value = null
                        }
                        else
                        {
                            state.attribute_value += char
                        }
                        break
                    case State.TagClose:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                        }
                        else
                        {
                            state.tag += char
                        }
                        break
                }
            }

            html += part
            if (i < values.length)
            {
                const value = values[i]

                if (state.current === State.TagInner && state.tag === 'x' && value instanceof MasterElement)
                {
                    html += ` x:element="${this.$_nodes.push(value) - 1}"`
                }
                else if (state.current === State.AttributeValueQuoted)
                {
                    if (value instanceof Signal)
                    {
                        html += `<$${value.id}>`
                        this.$_signal_attributes[value.id] = { signal: value, attribute: state.attribute_name! }
                    }
                    else
                    {
                        html += value.toString().replace(/"/g, '\\"')
                    }
                }
                else if (state.current === State.AttributeValueUnquoted)
                {
                    if (value instanceof Signal)
                    {
                        this.$_signal_attributes[value.id] = { signal: value, attribute: state.attribute_name! }
                        html += `"<$${value.id}>"`
                    }
                    else if (value instanceof Function)
                    {
                        // We use a random id to avoid collisions with fragments
                        const id = randomId()
                        this.$_listeners[id] = value
                        html += `${id}`
                    }
                    else
                        html += `"${value.toString().replaceAll('"', '\\"')}"`
                }
                else 
                {
                    if (value instanceof Signal)
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
                    html += `<x x:element="${this.$_nodes.length - 1}"></x>`
                }
            }
        }
        const template = document.createElement('template')
        template.innerHTML = html

        this.append(...Array.from(template.content.childNodes))
    }

    async $mount(mountPoint: Element | ShadowRoot, append = false)
    {
        const root = mountPoint instanceof ShadowRoot ? mountPoint : mountPoint.parentElement
        if (!root) throw new Error('Cannot mount template to a node that is not attached to the DOM')

        const toMount = this.insertNodes()

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
            const { attribute } = this.$_signal_attributes[id]
            const element = root.querySelector(`[${attribute}*="<$${id}>"]`)
            if (!element) throw new Error(`Cannot find element with attribute ${attribute}="${id}"`)
            const attributeSignalDerives = (element as any).$_attribute_signal_derives ?? ((element as any).$_attribute_signal_derives = {})
            if (attributeSignalDerives[attribute]) continue

            const original = element.getAttribute(attribute)!

            const signalIds: string[] = /<\$([^>]+)>/g.exec(original)!.slice(1)

            const update = () =>
            {
                let value = original
                for (const id of signalIds)
                {
                    const signal = this.$_signal_attributes[id].signal
                    value = value.replaceAll(`<$${id}>`, signal.value.toString())
                }
                return value
            }
            const signal = attributeSignalDerives[attribute] = signalDerive(update, ...signalIds.map(id => this.$_signal_attributes[id].signal))
            signal.subscribe((value) => element.setAttribute(attribute, value.replace(/"/g, '\\"')))
            onNodeDestroy(element, () => signal.cleanup())
        }
    }

    private insertNodes()
    {
        const toMount: { node: MasterElement | Template, outlet: Element }[] = []
        this.$_nodes.forEach((node, index) =>
        {
            const outlet = this.querySelector(`x[x\\:element="${index}"]`)
            if (!outlet) throw new Error(`No outlet found for node ${index}`)
            if (node instanceof MasterElement)
            {
                node.append(...Array.from(outlet.childNodes))
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