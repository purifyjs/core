import { randomId } from "../utils/id"
import { onNodeDestroy } from "../utils/node"
import { MasterElement } from "./element"
import { Signal, signalDerive, SignalMode } from "./signal"

function parseValue(value: any): Node
{
    if (value instanceof HTMLElement)
        return value
    else if (value instanceof DocumentFragment)
        return value
    else
        return document.createTextNode(`${value}`)
}

export function html(parts: TemplateStringsArray, ...values: unknown[])
{
    return new MasterTemplate(parts, ...values)
}

export class MasterTemplate extends DocumentFragment
{
    private $_nodes: Node[] = []
    private $_listeners: { event: string, id: string, callback: EventListener }[] = []
    private $_signals: Record<string, Signal<any>> = {}
    private $_signal_texts: Record<string, { startNode: Node, endNode: Node }> = {}
    private $_signal_classes: { className: string, signal: Signal<boolean> }[] = []

    constructor(parts: TemplateStringsArray, ...values: unknown[]) 
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
            const value = values[i]

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
            }

            html += part
            if (value !== undefined)
            {
                if (state.current === State.TagInner && state.tag === 'x' && part.trimEnd().endsWith('<x') && (value instanceof Node))
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

        if (!mountPoint.parentNode) throw new Error('Mount point must be attached to the DOM')

        const { toMount } = this.$_insertNodes()
        this.$_listenToEvents()
        const { cleanupRegisters } = this.$_subscribeToSignals()

        mountPoint.parentNode.replaceChild(this, mountPoint)
        for (const { node, outlet } of toMount)
        {
            if (node instanceof MasterElement || node instanceof MasterTemplate)
                await node.$mount(outlet)
            else
                outlet.replaceWith(node)
        }
        for (const registerCleanup of cleanupRegisters) registerCleanup()
    }

    private $_insertNodes()
    {
        const toMount: { node: Node, outlet: Element }[] = []
        for (const index of this.$_nodes.keys())
        {
            const node = this.$_nodes[index]
            const outlet = this.querySelector(`x[\\:outlet="${index}"]`)

            // We are not throwing an error here for debugging purposes
            if (!outlet) 
            {
                console.error(`Cannot find outlet ${index} for "${node.constructor.name}" node`)
                continue
            }
            
            if (node instanceof DocumentFragment)
            {
                outlet.removeAttribute(':outlet')
                if (outlet.hasAttributes()) throw new Error('Template alone cannot have attributes. Use element instead via defineElement')
            }
            else if (node instanceof Element)
            {
                node.append(...Array.from(outlet.childNodes))
                outlet.removeAttribute(':outlet')
                for (const attribute of Array.from(outlet.attributes))
                    node.setAttribute(attribute.name, attribute.value)
            }

            toMount.push({ node, outlet })
        }

        this.$_nodes = null!

        return { toMount }
    }

    private $_listenToEvents()
    {
        for (const listener of this.$_listeners)
        {
            const element = this.querySelector(`[on\\:${listener.event}="${listener.id}"]`)
            if (!element) throw new Error(`Cannot find element with event listener ${listener.event}=${listener.id}`)
            element.removeAttribute(`on:${listener.event}`)
            element.addEventListener(listener.event, listener.callback)
        }

        this.$_listeners = null!
    }

    private $_subscribeToSignals()
    {
        const cleanupRegisters: (() => void)[] = []

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
            cleanupRegisters.push(() => onNodeDestroy(startNode, () => sub.unsubscribe()))
        }

        this.querySelectorAll('*').forEach((node) =>
        {
            Array.from(node.attributes).forEach((attribute) =>
            {
                const signalIds: string[] = /<\$([^>]+)>/g.exec(attribute.value)?.slice(1) ?? []
                if (signalIds.length === 0) return

                const valueTemplate: (Signal | string)[] = attribute.value.split(/<\$([^>]+)>/g)
                    .map((value, index) => index % 2 === 0 ? value : this.$_signals[value])

                const signal = signalDerive(
                    () => valueTemplate.map((value) => value instanceof Signal ? value.value : value).join(''),
                    ...signalIds.map(id => 
                    {
                        const signal = this.$_signals[id]
                        if (!signal) throw new Error(`Cannot find signal ${id} at ${this.nodeName}`)
                        return signal
                    })
                )
                signal.subscribe((value) => node.setAttribute(attribute.name, value), { mode: SignalMode.Immediate })
                cleanupRegisters.push(() => onNodeDestroy(node, () => signal.cleanup()))
            })
        })

        for (const { className, signal } of this.$_signal_classes)
        {
            const node = this.querySelector(`[class\\:${className}="${signal.id}"]`)
            if (!node) throw new Error(`Cannot find element with class ${className}=${signal.id}`)
            node.removeAttribute(`class:${className}`)
            const sub = signal.subscribe((value) => value ? node.classList.add(className) : node.classList.remove(className))
            cleanupRegisters.push(() => onNodeDestroy(node, () => sub.unsubscribe()))
        }

        this.$_signals = null!
        this.$_signal_texts = null!
        this.$_signal_classes = null!

        return { cleanupRegisters }
    }
}