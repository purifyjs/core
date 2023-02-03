import { asMountableNode, makeMountableNode } from "../mountable"
import { createDerive, createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derivable"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { valueToNode } from "./node"
import { parseTemplateParts, TemplatePart, TemplateStateType } from "./parts"

export type TemplateValue = string | number | boolean | null | undefined | Node | SignalReadable<any> | SignalDeriver<any> | Function | TemplateValue[]

export const EMPTY_NODE = document.createDocumentFragment()
const SIGNAL_TEXT = Symbol('signal_text')

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T)
{
    return render(parseTemplateParts(strings), values)
}

export function render<T extends TemplateValue[]>(templateParts: TemplatePart[], values: T): Node[]
{
    const nodes: Node[] = []
    const outlets = {
        signals: {} as Record<string, SignalReadable<any>>,
        attributes: new Map<string, Map<string, unknown>>(),
    }

    let html = ''
    for (let i = 0; i < templateParts.length; i++)
    {
        const part = templateParts[i]!
        let value: any = values[i]

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
            if (!part.state.attribute_name.startsWith('on:'))
            {
                if (value instanceof Function) value = createOrGetDeriveOfFunction(value)
            }

            if (value instanceof SignalReadable)
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

                const valueTemplate: (SignalReadable | string)[] = attributeValue.split(/<\$([^>]+)>/g)
                    .map((value, index) => index % 2 === 0 ? value : outlets.signals[value]!).filter(value => value)

                const signal = createDerive(() => valueTemplate.map((value) => value instanceof SignalReadable ? value.value.toString() : value).join(''))
                value = signal
            }

            const splitedAttributeName = attributeName.split(':') as [string] | [string, string]
            const type: string | null = splitedAttributeName.length === 2 ? splitedAttributeName[0] : null
            const key: string = splitedAttributeName.length === 2 ? splitedAttributeName[1] : splitedAttributeName[0]

            switch (type)
            {
                case 'class':
                    if (!key) throw new Error(`Expected expected key after ${type}: in ${attributeName}`)
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                    if (value instanceof SignalReadable) asMountableNode(element).$subscribe(value, (active) => element.classList.toggle(key, !!active), { mode: 'immediate' })
                    else element.classList.toggle(key, !!value)
                    break
                case 'style':
                    if (!key) throw new Error(`Expected expected key after ${type}: in ${attributeName}`)
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                    if (value instanceof SignalReadable) asMountableNode(element).$subscribe(value, (value) => element.style.setProperty(key, `${value}`), { mode: 'immediate' })
                    else element.style.setProperty(key, `${value}`)
                    break
                case 'ref':
                    if (!(value instanceof SignalWritable<HTMLElement>)) throw new Error(`Expected ${SignalWritable.name} for ${attributeName} attribute, got ${value}`)
                    value.value = element
                    break
                case 'on': {
                    if (!key) throw new Error(`Expected expected key after ${type}: in ${attributeName}`)
                    if (!(value instanceof Function)) throw new Error(`Expected ${Function.name} for ${attributeName} attribute, got ${value}`)
                    makeMountableNode(element)
                    element.$onMount(() => element.addEventListener(key, value as EventListener))
                    element.$onUnmount(() => element.removeEventListener(key, value as EventListener))
                    break
                }
                case 'bind': {
                    if (!key) throw new Error(`Expected expected key after ${type}: in ${attributeName}`)
                    if (!(value instanceof SignalWritable<unknown>)) throw new Error(`Expected ${SignalWritable.name} for ${attributeName} attribute, got ${value}`)
                    const signal = value as SignalWritable<unknown>
                    switch (key)
                    {
                        case 'value': {
                            if (element instanceof HTMLInputElement)
                            {
                                switch (element.type)
                                {
                                    case 'radio':
                                    case 'checkbox': {
                                        const listener = () => signal.value = element.checked
                                        makeMountableNode(element)
                                        element.$onMount(() => element.addEventListener('input', listener))
                                        element.$onUnmount(() => element.removeEventListener('input', listener))
                                        element.$subscribe(signal, (value) => element.checked = !!value, { mode: 'immediate' })
                                        break
                                    }
                                    case 'range':
                                    case 'number': {
                                        if (typeof value !== 'number') throw new Error(`:bind:value attribute must be a number`)
                                        const listener = () => signal.value = element.valueAsNumber
                                        makeMountableNode(element)
                                        element.$onMount(() => element.addEventListener('input', listener))
                                        element.$onUnmount(() => element.removeEventListener('input', listener))
                                        element.$subscribe(signal, (value) => element.valueAsNumber = value as any, { mode: 'immediate' })
                                        break
                                    }
                                    case 'date':
                                    case 'datetime-local':
                                    case 'month':
                                    case 'time':
                                    case 'week': {
                                        if (!(value instanceof Date)) throw new Error(`:bind:value attribute must be a Date`)
                                        const listener = () => signal.value = element.valueAsDate
                                        makeMountableNode(element)
                                        element.$onMount(() => element.addEventListener('input', listener))
                                        element.$onUnmount(() => element.removeEventListener('input', listener))
                                        element.$subscribe(signal, (value) => element.valueAsDate = value as any, { mode: 'immediate' })
                                        break
                                    }
                                    default: {
                                        const listener = () => signal.value = element.value
                                        makeMountableNode(element)
                                        element.$onMount(() => element.addEventListener('input', listener))
                                        element.$onUnmount(() => element.removeEventListener('input', listener))
                                        element.$subscribe(signal, (value) => element.value = `${value}`, { mode: 'immediate' })
                                        break
                                    }
                                }
                                break
                            }
                            else if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)
                            {
                                const listener = () => signal.value = element.value
                                makeMountableNode(element)
                                element.$onMount(() => element.addEventListener('input', listener))
                                element.$onUnmount(() => element.removeEventListener('input', listener))
                                element.$subscribe(signal, (value) => element.value = `${value}`, { mode: 'immediate' })
                                break
                            }

                            throw new Error(`${attributeName} attribute is not supported on ${element.tagName} element`)
                        }
                        default:
                            throw new Error(`Unknown ${type}: key ${key}, at ${attributeName}`)
                    }
                    break
                }
                default:
                    if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                    if (value instanceof SignalReadable) asMountableNode(element).$subscribe(value, (value) => element.setAttribute(attributeName, `${value}`), { mode: 'immediate' })
                    else element.setAttribute(attributeName, `${value}`)
                    break
            }
            // if (type) element.removeAttribute(attributeName)
        }
    }

    return Array.from(template.content.childNodes)
}