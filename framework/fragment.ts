import { randomId } from "../utils/id"
import { Signal, SignalSubscriptionMode } from "./signal/base"
import { SignalValue } from "./signal/value"
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
        else if (value instanceof Signal)
        {
            const fragment = document.createDocumentFragment()
            const startComment = document.createComment(`signal ${value.id}`)
            const endComment = document.createComment(`/signal ${value.id}`)
            fragment.append(startComment, endComment)

            masterTooling(startComment).subscribe(value, (value) => 
            {
                while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
                startComment.after(valueToNode(value))
            }, { mode: SignalSubscriptionMode.Immediate })

            return fragment
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
    const outlets = {
        signals: {} as Record<string, Signal<any>>,
        eventListeners: [] as { ref: string, eventName: string, listener: EventListener }[],
        elementRefs: [] as { ref: string, nodeSignal: SignalValue<Element> }[],
        attributesWithSignals: [] as { ref: string, attributeName: string }[],
        signalClasses: [] as { ref: string, className: string, activeSignal: Signal<boolean> }[],
    }

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
        tag: '',
        tag_ref: '',
        attribute_name: '',
        attribute_key: '',
        attribute_value: ''
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
                        state.tag_ref = randomId()
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
                        /* html += ` ::ref="${ref}"` */
                    }
                    else if (char === ' ')
                    {
                        state.current = State.TagInner
                        html += ` ::ref="${state.tag_ref}"`
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
                    }
                    else if (char === ' ')
                    {
                        state.current = State.TagInner
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
                    }
                    else if (char === ' ')
                    {
                        state.current = State.TagInner
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
                    }
                    else if (char === ' ')
                    {
                        state.current = State.TagInner
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
                    }
                    else
                    {
                        state.tag += char
                    }
                    break
            }
            if (state.current >= State.AttributeName && state.current <= State.AttributeValueDoubleQuoted && 
                state.attribute_name.startsWith(':')) continue
            html += char
        }

        if (value !== undefined && value !== null)
        {
            if (state.current === State.TagInner && state.tag === 'x' && part.trimEnd().endsWith('<x') && value instanceof Element)
            {
                html += `::outlet="${nodes.push(valueToNode(value)) - 1}"`
            }
            else if (value instanceof Signal && (state.current === State.AttributeValueDoubleQuoted || state.current === State.AttributeValueSingleQuoted))
            {
                html += `<$${value.id}>`
                outlets.signals[value.id] = value
                outlets.attributesWithSignals.push({
                    ref: state.tag_ref,
                    attributeName: state.attribute_name
                })
            }
            else if (value instanceof Signal && state.current === State.AttributeValueUnquoted)
            {
                if (state.attribute_name === ':class' && state.attribute_key)
                {
                    outlets.signalClasses.push({
                        ref: state.tag_ref,
                        className: state.attribute_key,
                        activeSignal: value
                    })
                }
                else if (state.attribute_name === ':ref' && value instanceof SignalValue<Element>)
                {
                    outlets.elementRefs.push({
                        ref: state.tag_ref,
                        nodeSignal: value
                    })
                }
                else
                {
                    html += `"<$${value.id}>"`
                    outlets.signals[value.id] = value
                    outlets.attributesWithSignals.push({
                        ref: state.tag_ref,
                        attributeName: state.attribute_name
                    })
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
                if (state.attribute_name === ':on' && state.attribute_key && value instanceof Function)
                {
                    outlets.eventListeners.push({
                        ref: state.tag_ref,
                        eventName: state.attribute_key,
                        listener: value as EventListener
                    })
                }
                else html += `"${`${value}`.replace(/"/g, "&quot;")}"`
            }
            else if (state.current === State.Outer)
            {
                html += `<x ::outlet="${nodes.push(valueToNode(value)) - 1}"></x>`
            }
            else throw new Error(`Unexpected value at\n${html.slice(-256)}\${${value}}...`)
        }
    }

    const template = document.createElement('template')
    template.innerHTML = html

    for (const index in nodes)
    {
        const node = nodes[index]
        const outlet = template.content.querySelector(`x[\\:\\:outlet="${index}"]`)
        if (!outlet) throw new Error(`No outlet for node ${index}`)

        if (node instanceof Element)
        {
            node.append(...Array.from(outlet.childNodes))
            outlet.removeAttribute('::outlet')
            for (const attribute of Array.from(outlet.attributes))
            {
                outlet.removeAttribute(attribute.name)
                node.setAttribute(attribute.name, attribute.value)
            }
        }

        outlet.replaceWith(node)
    }

    for (const { ref, eventName, listener } of outlets.eventListeners)
    {
        const element = template.content.querySelector(`[\\:\\:ref="${ref}"]`)
        if (!element) throw new Error(`No element ${ref} for event listener ${eventName}`)
        element.addEventListener(eventName, listener)
    }

    for (const { ref, className, activeSignal } of outlets.signalClasses)
    {
        const node = template.content.querySelector(`[\\:\\:ref="${ref}"]`)
        if (!node) throw new Error(`No node ${ref} for signal class ${className}`)
        masterTooling(node).subscribe(activeSignal, value => node.classList.toggle(className, value))
    }

    outlets.attributesWithSignals.forEach(({ ref, attributeName }) =>
    {
        const node = template.content.querySelector(`[\\:\\:ref="${ref}"]`)
        if (!node) throw new Error(`Cannot find element with ref ${ref}`)
        const attributeValue = node.getAttribute(attributeName)
        if (!attributeValue) throw new Error(`Cannot find attribute ${attributeName} on element with ref ${ref}`)

        const signalIds: string[] = /<\$([^>]+)>/g.exec(attributeValue)?.slice(1) ?? []
        if (signalIds.length === 0) return

        const valueTemplate: (Signal | string)[] = attributeValue.split(/<\$([^>]+)>/g)
            .map((value, index) => index % 2 === 0 ? value : outlets.signals[value]).filter(value => value)

        const $ = masterTooling(node)

        const signal = $.compute(() => valueTemplate.map((value) => value instanceof Signal ? value.value : value).join(''),
            ...signalIds.map(id => 
            {
                const signal = outlets.signals[id]
                if (!signal) throw new Error(`Cannot find signal ${id}`)
                return signal
            })
        )
        $.subscribe(signal, (value) => node.setAttribute(attributeName, value), { mode: SignalSubscriptionMode.Immediate })
    })

    for (const { ref, nodeSignal } of outlets.elementRefs)
    {
        const node = template.content.querySelector(`[\\:\\:ref="${ref}"]`)
        if (!node) throw new Error(`Cannot find element with ref ${ref}`)
        nodeSignal.set(node)
    }

    template.content.querySelectorAll('[\\:\\:ref]').forEach((node) => node.removeAttribute('::ref'))

    return template.content
}