import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"
import type { SignalDerive } from "../signal/derived"
import { SignalSettable } from "../signal/settable"
import { valueToNode } from "./node"
import { parseTemplateParts, TemplatePart, TemplateStateType } from "./parts"

export type TemplateValue = string | number | boolean | null | undefined | Node | Signal<any> | SignalDerive<any> | EventListener | TemplateValue[]

export const EMPTY_NODE = document.createDocumentFragment()
const SIGNAL_TEXT = Symbol('signal_text')

export function html<T extends TemplateValue[]>(parts: TemplateStringsArray, ...values: T)
{
    return template(parts, values)
}

export function createTemplateCache()
{
    let cache: TemplatePart[] | null = null
    return {
        html: <T extends unknown[]>(parts: TemplateStringsArray, ...values: T) => template(parts, values, cache ?? (cache = parseTemplateParts(parts)))
    }
}

export function template<T extends unknown[]>(parts: TemplateStringsArray, values: T, templateParts = parseTemplateParts(parts)): Node[]
{
    const nodes: Node[] = []
    const outlets = {
        signals: {} as Record<string, Signal<any>>,
        attributes: new Map<string, Map<string, unknown>>(),
    }

    let html = ''
    for (let i = 0; i < templateParts.length; i++)
    {
        const { html: partHtml, state } = templateParts[i]!
        const value = values[i]

        html += partHtml

        if (values.length === 0 || i >= values.length) continue

        let unexpected = true

        if (state.type === TemplateStateType.Outer)
        {
            const node = valueToNode(value)
            if (node) 
            {
                html += `<x :outlet="${nodes.push(node) - 1}"></x>`
                unexpected = false
            }
        }
        else if (state.type === TemplateStateType.TagInner && state.tag === 'x' && !state.attribute_name && value instanceof HTMLElement)
        {
            const node = valueToNode(value)
            if (node)
            {
                state.attribute_name = ':outlet'
                html += `:outlet="${nodes.push(node) - 1}"`
                unexpected = false
            }
        }
        else if (state.type > TemplateStateType.ATTR_VALUE_START && state.type < TemplateStateType.ATTR_VALUE_END)
        {
            if (value instanceof Signal)
            {
                html += state.type === TemplateStateType.AttributeValueUnquoted ? `"<$${value.id}>"` : `<$${value.id}>`
                outlets.signals[value.id] = value
            }
            const refMap = outlets.attributes
            const attributeMap = refMap.get(state.tag_ref) ?? refMap.set(state.tag_ref, new Map()).get(state.tag_ref)!
            if (!attributeMap.has(state.attribute_name))
                attributeMap.set(state.attribute_name, state.type === TemplateStateType.AttributeValueUnquoted ? value : SIGNAL_TEXT)

            unexpected = false
        }

        if (unexpected) throw new Error(`Unexpected value at\n${html.slice(-256)}\${${value}}...`)
    }

    const template = document.createElement('template')
    template.innerHTML = html

    for (const index in nodes)
    {
        const node = nodes[index]!
        const outlet = template.content.querySelector(`x[\\:outlet="${index}"]`)
        if (!outlet) throw new Error(`No outlet for node ${index}`)

        if (node instanceof HTMLElement)
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

    for (const [ref, nameMap] of outlets.attributes)
    {
        for (let [attributeName, value] of nameMap)
        {
            const element = template.content.querySelector<HTMLElement>(`[\\:ref="${ref}"]`)
            if (!element) throw new Error(`No element for ref ${ref} with attribute ${attributeName}`)
            if (value === SIGNAL_TEXT)
            {
                const attributeValue = element.getAttribute(attributeName)
                if (!attributeValue) throw new Error(`Cannot find attribute ${attributeName} on element with ref ${ref}`)

                const signalIds: string[] = /<\$([^>]+)>/g.exec(attributeValue)?.slice(1) ?? []
                if (signalIds.length === 0) continue

                const valueTemplate: (Signal | string)[] = attributeValue.split(/<\$([^>]+)>/g)
                    .map((value, index) => index % 2 === 0 ? value : outlets.signals[value]!).filter(value => value)

                const $ = injectOrGetMasterAPI(element)
                const signal = $.derive(() => valueTemplate.map((value) => value instanceof Signal ? value.value.toString() : value).join(''))
                value = signal
            }

            const [name, key] = attributeName.split(':')

            switch (name)
            {
                case 'class':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (value instanceof Function) value = injectOrGetMasterAPI(element).derive(value as SignalDerive<unknown>)
                    if (value instanceof Signal) injectOrGetMasterAPI(element).subscribe(value, (active) => element.classList.toggle(key, !!active), { mode: 'immediate' })
                    else element.classList.toggle(key, !!value)
                    break
                case 'style':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (value instanceof Function) value = injectOrGetMasterAPI(element).derive(value as SignalDerive<unknown>)
                    if (value instanceof Signal) injectOrGetMasterAPI(element).subscribe(value, (value) => element.style.setProperty(key, `${value}`), { mode: 'immediate' })
                    else element.style.setProperty(key, `${value}`)
                    break
                case 'ref':
                    if (!(value instanceof SignalSettable<HTMLElement>)) throw new Error(`:ref attribute must be a SignalSettable<HTMLElement>`)
                    value.value = element
                    break
                case 'on':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (!(value instanceof Function)) throw new Error(`:on attribute must be a function`)
                    element.addEventListener(key, value as EventListener)
                    break
                default:
                    if (!name) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (value instanceof Function) value = injectOrGetMasterAPI(element).derive(value as SignalDerive<unknown>)
                    if (value instanceof Signal) injectOrGetMasterAPI(element).subscribe(value, value => element.setAttribute(name, value))
                    else element.setAttribute(attributeName, `${value}`)
                    break
            }
            if (key) element.removeAttribute(attributeName)
        }
    }

    return Array.from(template.content.childNodes)
}