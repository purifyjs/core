import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"
import { createDerive, createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derive"
import { SignalSettable } from "../signal/settable"
import { valueToNode } from "./node"
import { parseTemplateParts, TemplatePart, TemplateStateType } from "./parts"

export type TemplateValue = string | number | boolean | null | undefined | Node | Signal<any> | SignalDeriver<any> | Function | TemplateValue[]
export type TemplateHtmlArray = readonly string[]

export type TemplateValueArrayFromHtmlArray<_T extends readonly string[]> = TemplateValue[]

export const EMPTY_NODE = document.createDocumentFragment()
const SIGNAL_TEXT = Symbol('signal_text')

export function html<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, ...values: T)
{
    return template(parts, values)
}

export function createTemplateCache()
{
    let cache: TemplatePart[] | null = null
    return {
        html: (parts, ...values) => template(parts, values, cache ?? (cache = parseTemplateParts(parts)))
    } satisfies { html: typeof html }
}

export function template<S extends TemplateHtmlArray, T extends TemplateValueArrayFromHtmlArray<S>>(parts: S, values: T, templateParts = parseTemplateParts(parts)): Node[]
{
    const nodes: Node[] = []
    const outlets = {
        signals: {} as Record<string, Signal<any>>,
        attributes: new Map<string, Map<string, unknown>>(),
    }

    let html = ''
    for (let i = 0; i < templateParts.length; i++)
    {
        const part = templateParts[i]!
        const value: any = values[i]

        html += part.html

        if (values.length === 0 || i >= values.length) continue

        let unexpected = true

        if (part.state.type === TemplateStateType.Outer)
        {
            const node = valueToNode(value)
            if (node) 
            {
                html += `<x :outlet="${nodes.push(node) - 1}"></x>`
                unexpected = false
            }
        }
        else if (part.state.type === TemplateStateType.TagInner && !part.state.attribute_name)
        {
            if (part.state.tag === 'x')
            {
                if (value instanceof HTMLElement)
                {
                    const node = valueToNode(value)
                    if (node)
                    {
                        part.state.attribute_name = ':outlet'
                        html += `:outlet="${nodes.push(node) - 1}"`
                        unexpected = false
                    }
                }
            }
        }
        else if (part.state.type > TemplateStateType.ATTR_VALUE_START && part.state.type < TemplateStateType.ATTR_VALUE_END)
        {
            if (value instanceof Signal)
            {
                html += part.state.type === TemplateStateType.AttributeValueUnquoted ? `"<$${value.id}>"` : `<$${value.id}>`
                outlets.signals[value.id] = value
            }
            else
            {
                html += part.state.type === TemplateStateType.AttributeValueUnquoted ? `""` : ``
            }
            const refMap = outlets.attributes
            const attributeMap = refMap.get(part.state.tag_ref) ?? refMap.set(part.state.tag_ref, new Map()).get(part.state.tag_ref)!
            if (!attributeMap.has(part.state.attribute_name))
                attributeMap.set(part.state.attribute_name, part.state.type === TemplateStateType.AttributeValueUnquoted ? value : SIGNAL_TEXT)

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

                const signal = createDerive(() => valueTemplate.map((value) => value instanceof Signal ? value.value.toString() : value).join(''))
                value = signal
            }

            const splitedAttributeName = attributeName.split(':') as [string] | [string, string]
            const type: string | null = splitedAttributeName.length === 2 ? splitedAttributeName[0] : null
            const key: string = splitedAttributeName.length === 2 ? splitedAttributeName[1] : splitedAttributeName[0]

            switch (type)
            {
                case 'class':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                    if (value instanceof Signal) injectOrGetMasterAPI(element).subscribe(value, (active) => element.classList.toggle(key, !!active), { mode: 'immediate' })
                    else element.classList.toggle(key, !!value)
                    break
                case 'style':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
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
                    const m = injectOrGetMasterAPI(element)
                    m.onMount(() => element.addEventListener(key, value as EventListener))
                    m.onUnmount(() => element.removeEventListener(key, value as EventListener))
                    break
                case 'bind':
                    if (!key) throw new Error(`Invalid attribute name ${attributeName}`)
                    if (!(value instanceof SignalSettable<unknown>)) throw new Error(`:bind attribute must be a SignalSettable`)
                    const signal = value as SignalSettable<unknown>
                    switch (key)
                    {
                        case 'value':
                            if (!(
                                element instanceof HTMLInputElement || 
                                element instanceof HTMLTextAreaElement || 
                                element instanceof HTMLSelectElement
                            )) throw new Error(`:bind:value attribute must be on an input element`)
                            const listener = () => signal.value = element.value
                            const m = injectOrGetMasterAPI(element)
                            m.onMount(() => element.addEventListener('input', listener))
                            m.onUnmount(() => element.removeEventListener('input', listener))
                            m.subscribe(signal, (value) => element.value = `${value}`, { mode: 'immediate' })
                            break
                    }
                default:
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                    if (value instanceof Signal) injectOrGetMasterAPI(element).subscribe(value, (value) => element.setAttribute(key, `${value}`), { mode: 'immediate' })
                    else element.setAttribute(attributeName, `${value}`)
                    break
            }
            // if (type) element.removeAttribute(attributeName) Gonna keep it for now for debugging
        }
    }

    return Array.from(template.content.childNodes)
}