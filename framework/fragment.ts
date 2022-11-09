import { randomId } from "../utils/id"
import { Signal, signalDerive, SignalMode } from "./signal"
import { masterTooling } from "./tooling"

export const EMPTY_NODE = document.createDocumentFragment()

export function html(parts: TemplateStringsArray, ...values: unknown[])
{
    function valueToNode(value: any): Node
    {
        if (value instanceof Node)
        {
            return value
        }
        else if (value instanceof Array)
        {
            const fragment = document.createDocumentFragment()
            for (const item of value) fragment.append(valueToNode(item))
            return fragment
        }
        else
        {
            return document.createTextNode(`${value}`)
        }
    }

    const nodes: Node[] = []
    const listeners: { event: string, id: string, callback: EventListener }[] = []
    const signals: Record<string, Signal<any>> = {}
    const signal_classes: { className: string, signal: Signal<boolean> }[] = []

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
        if (value !== undefined && value !== null)
        {
            if (state.current === State.TagInner && state.tag === 'x' && part.trimEnd().endsWith('<x') && value instanceof Element)
            {
                html += `:outlet="${nodes.push(valueToNode(value)) - 1}"`
            }
            else if (value instanceof Signal && (state.current === State.AttributeValueDoubleQuoted || state.current === State.AttributeValueSingleQuoted))
            {
                html += `<$${value.id}>`
                signals[value.id] = value
            }
            else if (value instanceof Signal && state.current === State.AttributeValueUnquoted)
            {
                if (state.attribute_name === 'class' && state.attribute_key)
                {
                    html += `"${value.id}"`
                    signals[value.id] = value
                    signal_classes.push({ className: state.attribute_key, signal: value })
                }
                else
                {
                    html += `"<$${value.id}>"`
                    signals[value.id] = value
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
                    listeners.push({ id, event: state.attribute_key, callback: value as EventListener })
                    html += `${id}`
                }
                else html += `"${`${value}`.replace(/"/g, "&quot;")}"`
            }
            else if (state.current === State.Outer)
            {
                if (value instanceof Signal)
                {
                    signals[value.id] = value
                    html += `<x :signal="${value.id}"></x>`
                }
                else
                {
                    html += `<x :outlet="${nodes.push(valueToNode(value)) - 1}"></x>`
                }
            }
            else throw new Error(`Unexpected value at\n${html.slice(-256)}\${${value}}...`)
        }
    }

    const template = document.createElement('template')
    template.innerHTML = html

    for (const index in nodes)
    {
        const node = nodes[index]
        const outlet = template.content.querySelector(`x[\\:outlet="${index}"]`)
        if (!outlet) throw new Error(`No outlet for node ${index}`)

        if (node instanceof Element)
        {
            node.append(...Array.from(outlet.childNodes))
            outlet.removeAttribute(':outlet')
            for (const attribute of Array.from(outlet.attributes))
            {
                outlet.removeAttribute(attribute.name)
                node.setAttribute(attribute.name, attribute.value)
            }
        }

        outlet.replaceWith(node)
    }

    for (const { id, event, callback } of listeners)
    {
        const element = template.content.querySelector(`[on\\:${event}="${id}"]`)
        if (!element) throw new Error(`No element for listener ${id}`)
        element.removeAttribute(`on:${event}`)
        element.addEventListener(event, callback)
    }

    for (const { className, signal } of signal_classes)
    {
        const node = template.content.querySelector(`[class\\:${className}="${signal.id}"]`)
        if (!node) throw new Error(`Cannot find element with class ${className}=${signal.id}`)
        node.removeAttribute(`class:${className}`)
        masterTooling(node).subscribe(signal, value => { node.classList.toggle(className, value) })
    }

    template.content.querySelectorAll('*').forEach((node) =>
    {
        Array.from(node.attributes).forEach((attribute) =>
        {
            const signalIds: string[] = /<\$([^>]+)>/g.exec(attribute.value)?.slice(1) ?? []
            if (signalIds.length === 0) return

            const valueTemplate: (Signal | string)[] = attribute.value.split(/<\$([^>]+)>/g)
                .map((value, index) => index % 2 === 0 ? value : signals[value])

            const signal = signalDerive(
                () => valueTemplate.map((value) => value instanceof Signal ? value.value : value).join(''),
                ...signalIds.map(id => 
                {
                    const signal = signals[id]
                    if (!signal) throw new Error(`Cannot find signal ${id}`)
                    return signal
                })
            )
            masterTooling(node).subscribe(signal, value => node.setAttribute(attribute.name, value), { mode: SignalMode.Immediate })
        })
    })

    Array.from(template.content.querySelectorAll(`x[\\:signal]`)).forEach((element: Element) =>
    {
        const signal = signals[element.getAttribute(':signal')!]
        if (!signal) throw new Error(`No signal for element ${element}`)

        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(`signal ${signal.id}`)
        const endComment = document.createComment(`/signal ${signal.id}`)
        fragment.append(startComment, endComment)
        element.replaceWith(fragment)

        masterTooling(startComment).subscribe(signal, (value) => 
        {
            while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
            startComment.after(valueToNode(value))
        }, { mode: SignalMode.Immediate })
    })

    return template.content
}