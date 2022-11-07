import { randomId } from "../utils/id"
import { onNodeDestroy } from "../utils/node"
import { MasterElement } from "./element"
import { Signal, signalDerive } from "./signal"

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
    private $_nodes: Node[] = []
    private $_listeners: { event: string, id: string, callback: EventListener }[] = []
    private $_signals: Record<string, Signal<any>> = {}
    private $_signal_texts: Record<string, { startNode: Node, endNode: Node }> = {}
    private $_signal_classes: { className: string, signal: Signal<boolean> }[] = []

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
            AttributeKey,
            AttributeValueUnquoted,
            AttributeValueSingleQuoted,
            AttributeValueDoubleQuoted
        }

        const state = {
            current: State.Outer,
            tag: null as string | null,
            attribute_name: null as string | null,
            attribute_key: null as string | null,
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
                        else if (char === ':')
                        {
                            state.current = State.AttributeKey
                            state.attribute_key = ''
                        }
                        else
                        {
                            state.attribute_name += char
                        }
                        break
                    case State.AttributeKey:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                            state.attribute_name = null
                            state.attribute_key = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_key = null
                        }
                        else if (char === '=')
                        {
                            state.current = State.AttributeValueUnquoted
                            state.attribute_value = ''
                        }
                        else
                        {
                            state.attribute_key += char
                        }
                        break
                    case State.AttributeValueUnquoted:
                        if (char === '>')
                        {
                            state.current = State.Outer
                            state.tag = null
                            state.attribute_name = null
                            state.attribute_value = null
                            state.attribute_key = null
                        }
                        else if (char === ' ')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_value = null
                            state.attribute_key = null
                        }
                        else if (char === '"')
                        {
                            state.current = State.AttributeValueDoubleQuoted
                            state.attribute_value = ''
                        }
                        else if (char === "'")
                        {
                            state.current = State.AttributeValueSingleQuoted
                            state.attribute_value = ''
                        }
                        else
                        {
                            state.attribute_value += char
                        }
                        break
                    case State.AttributeValueSingleQuoted:
                        if (char === "'")
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_value = null
                            state.attribute_key = null
                        }
                        else
                        {
                            state.attribute_value += char
                        }
                        break
                    case State.AttributeValueDoubleQuoted:
                        if (char === '"')
                        {
                            state.current = State.TagInner
                            state.attribute_name = null
                            state.attribute_value = null
                            state.attribute_key = null
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
                html += char
            }

            if (i < values.length)
            {
                const value: unknown = values[i]

                if (state.current === State.TagInner && state.tag === 'x' && part.trimEnd().endsWith('<x') && (value instanceof MasterElement || value instanceof Template))
                {
                    html += `:outlet="${this.$_nodes.push(value) - 1}"`
                }
                else if (value instanceof Signal && (state.current === State.AttributeValueDoubleQuoted || state.current === State.AttributeValueSingleQuoted))
                {
                    html += `<$${value.id}>`
                    this.$_signals[value.id] = value
                }
                else if (value instanceof Signal && state.current === State.AttributeValueUnquoted)
                {
                    if (state.attribute_name === 'class' && state.attribute_key)
                    {
                        html += `"${value.id}"`
                        this.$_signals[value.id] = value
                        this.$_signal_classes.push({ className: state.attribute_key, signal: value })
                    }
                    else
                    {
                        html += `"<$${value.id}>"`
                        this.$_signals[value.id] = value
                    }
                }
                else if (state.current === State.AttributeValueDoubleQuoted)
                {
                    html += `${value}`.replace(/"/g, "&quot;")
                }
                else if (state.current === State.AttributeValueSingleQuoted)
                {
                    html += `${value}`.replace(/'/g, "&#39;")
                }
                else if (state.current === State.AttributeValueUnquoted)
                {
                    if (state.attribute_name === 'on' && state.attribute_key && value instanceof Function)
                    {
                        // We use a random id to avoid collisions with fragments
                        const id = randomId()
                        this.$_listeners.push({ id, event: state.attribute_key, callback: value as EventListener })
                        html += `${id}`
                    }
                    else html += `"${`${value}`.replace(/"/g, "&quot;")}"`
                }
                else if (state.current === State.Outer)
                {
                    if (value instanceof Signal)
                    {
                        const fragment = document.createDocumentFragment()
                        const comment = `signal ${value.id}`
                        const startComment = document.createComment(comment)
                        const endComment = document.createComment(`/${comment}`)

                        const node = parseValue(value.value)
                        fragment.append(startComment, node, endComment)

                        this.$_signal_texts[value.id] = { startNode: startComment, endNode: endComment }
                        this.$_signals[value.id] = value

                        this.$_nodes.push(fragment)
                    }
                    else
                    {
                        this.$_nodes.push(parseValue(value))
                    }
                    html += `<x :outlet="${this.$_nodes.length - 1}"></x>`
                }
                else throw new Error(`Unexpected value at\n${html.slice(-256)}\${${value}}...`)
            }
        }
        const template = document.createElement('template')
        template.innerHTML = html

        this.append(...Array.from(template.content.childNodes))
    }

    private $_mounted = false

    async $mount(mountPoint: Node)
    {
        if (this.$_mounted) throw new Error('Template already mounted')
        this.$_mounted = true

        const rootForQuery = mountPoint.parentElement ?? (mountPoint.parentNode instanceof ShadowRoot ? mountPoint.parentNode : null)
        if (!rootForQuery) throw new Error('Cannot mount template without a parent element or shadow root')

        const toMount = this.$_insertNodes()
        rootForQuery.replaceChild(this, mountPoint)

        await Promise.all(toMount.map(async ({ mountable: node, outlet }) => 
        {
            if (node instanceof MasterElement)
            {
                node.append(...Array.from(outlet.childNodes))
                outlet.removeAttribute(':outlet')
                for (const attribute of Array.from(outlet.attributes))
                    node.setAttribute(attribute.name, attribute.value)
            }
            else if (node instanceof Template)
            {
                const slot = node.querySelector('slot')
                if (node.firstChild && slot)
                    slot.replaceWith(...Array.from(outlet.childNodes))
                else if (slot)
                    slot.remove()
                else
                    node.append(...Array.from(outlet.childNodes))

                outlet.removeAttribute(':outlet')
                if (outlet.hasAttributes()) throw new Error('Template alone cannot have attributes. Use element instead via defineElement')
            }
            await node.$mount(outlet)
        }))

        this.$_listenToEvents(rootForQuery)
        this.$_subscribeToSignals(rootForQuery)
    }

    private $_insertNodes()
    {
        const toMount: { mountable: MasterElement | Template, outlet: Element }[] = []
        this.$_nodes.forEach((node, index) =>
        {
            const outlet = this.querySelector(`x[\\:outlet="${index}"]`)
            // We are not throwing an error here for debugging purposes
            if (!outlet) return console.error(`Cannot find outlet ${index} for "${node.constructor.name}" node`)
            if (node instanceof Template || node instanceof MasterElement)
                toMount.push({ mountable: node, outlet })
            else
                outlet.replaceWith(node)
        })

        this.$_nodes = null!

        return toMount
    }

    private $_listenToEvents(root: Element | ShadowRoot)
    {
        for (let listener = this.$_listeners.shift(); listener; listener = this.$_listeners.shift())
        {
            const element = root.querySelector(`[on\\:${listener.event}="${listener.id}"]`)
            if (!element) throw new Error(`Cannot find element with event listener ${listener.event}=${listener.id}`)
            element.removeAttribute(`on:${listener.event}`)
            element.addEventListener(listener.event, listener.callback)
        }

        this.$_listeners = null!
    }

    private $_subscribeToSignals(root: Element | ShadowRoot)
    {
        for (const id in this.$_signal_texts)
        {
            const signal = this.$_signals[id]
            const { startNode, endNode } = this.$_signal_texts[id]
            const sub = signal.subscribe((value) =>
            {
                const newNode = parseValue(value)
                while (startNode.nextSibling !== endNode) startNode.nextSibling!.remove()
                if (!startNode.parentNode) throw new Error('Cannot replace node that is not attached to the DOM')
                startNode.parentNode.insertBefore(newNode, endNode)
            })
            onNodeDestroy(startNode, () => sub.unsubscribe())
        }

        root.querySelectorAll('*').forEach((node) =>
        {
            Array.from(node.attributes).forEach((attribute) =>
            {
                const signalIds: string[] = /<\$([^>]+)>/g.exec(attribute.value)?.slice(1) ?? []
                if (signalIds.length === 0) return

                const valueTemplate: (Signal | string)[] = attribute.value.split(/<\$([^>]+)>/g)
                    .map((value, index) => index % 2 === 0 ? value : this.$_signals[value])

                const signal = signalDerive(
                    () => valueTemplate.map((value) => value instanceof Signal ? value.value : value).join(''),
                    ...signalIds.map(id => this.$_signals[id])
                )
                signal.subscribe((value) => node.setAttribute(attribute.name, value))
                onNodeDestroy(node, () => signal.cleanup())
            })
        })

        for (const { className, signal } of this.$_signal_classes)
        {
            const node = root.querySelector(`[class\\:${className}="${signal.id}"]`)
            if (!node) throw new Error(`Cannot find element with class ${className}=${signal.id}`)
            node.removeAttribute(`class:${className}`)
            const sub = signal.subscribe((value) => value ? node.classList.add(className) : node.classList.remove(className))
            onNodeDestroy(node, () => sub.unsubscribe())
        }

        this.$_signals = null!
        this.$_signal_texts = null!
        this.$_signal_classes = null!
    }
}