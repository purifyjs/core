import { ComponentBase } from "../component"
import { asMountableNode, makeMountableNode } from "../mountable"
import { createDerive, createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derivable"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { nameOf, typeOf } from "../utils/name"
import { bindToElement } from "./bind"
import { valueToNode } from "./node"
import { parseTemplateHtml } from "./parse/html"
import { parseTemplateDescriptor, TemplateDescriptor, TemplateValueDescriptorType } from "./parse/descriptor"

export type TemplateValue = string | number | boolean | Node | SignalReadable<any> | SignalDeriver<any> | Function | TemplateValue[]
export interface Template
{
    strings: TemplateStringsArray
    values: TemplateValue[]
}

export const EMPTY_NODE = document.createDocumentFragment()

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T)
{
    return render(parseTemplateDescriptor(parseTemplateHtml(strings)), values)
}

export function template<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T)
{
    return { strings, values }
}

export function render<T extends TemplateValue[]>(templateDescriptor: TemplateDescriptor, values: T): Node[]
{
    const fragment = templateDescriptor.template.content.cloneNode(true) as DocumentFragment

    try
    {
        for (let index = 0; index < values.length; index++)
        {
            const descriptor = templateDescriptor.valueDescriptors[index]!
            let value = values[index]

            switch (descriptor.type)
            {
                case TemplateValueDescriptorType.RenderNode:
                    {
                        const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)
                        if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
                        outlet.replaceWith(valueToNode(value))
                    }
                    break
                case TemplateValueDescriptorType.RenderComponent:
                    {
                        if (!(value instanceof ComponentBase)) throw new Error(`Expected ${nameOf(ComponentBase)} at index "${index}", but got ${nameOf(value)}.`)
                        const outlet = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`)
                        if (!outlet) throw new Error(`Could not find outlet with ref "${descriptor.ref}".`)
                        value.append(...Array.from(outlet.childNodes))
                        outlet.removeAttribute(':outlet')
                        for (const attribute of Array.from(outlet.attributes))
                            value.setAttribute(attribute.name, attribute.value)
                        outlet.replaceWith(value)
                    }
                    break
                case TemplateValueDescriptorType.Attribute:
                    {
                        const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
                        if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
                        if (value instanceof Function) values[index] = value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                        if (value instanceof SignalReadable)
                        {
                            if (descriptor.quote === '')
                            {
                                makeMountableNode(element)
                                element.$subscribe(value, (value) => element.setAttribute(descriptor.attribute.name, `${value}`), { mode: 'immediate' })
                            }
                            else
                            {
                                // Handled at the end.
                            }
                        }
                        else
                        {
                            if (descriptor.quote === '') element.setAttribute(descriptor.attribute.name, `${value}`)
                            else
                            {
                                // Handled at the end.
                            }
                        }
                    }
                    break
                case TemplateValueDescriptorType.Directive:
                    {
                        const element = fragment.querySelector(`[\\:ref="${descriptor.ref}"]`) as HTMLElement
                        if (!element) throw new Error(`Could not find element with ref "${descriptor.ref}".`)
                        switch (descriptor.attribute.type)
                        {
                            case 'class':
                                if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                                if (value instanceof SignalReadable) asMountableNode(element).$subscribe(value, (v) => element.classList.toggle(descriptor.attribute.name, !!v), { mode: 'immediate' })
                                else element.classList.toggle(descriptor.attribute.name, !!value)
                                break
                            case 'style':
                                if (value instanceof Function) value = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
                                if (value instanceof SignalReadable) asMountableNode(element).$subscribe(value, (v) => element.style.setProperty(descriptor.attribute.name, `${v}`), { mode: 'immediate' })
                                else element.style.setProperty(descriptor.attribute.name, `${value}`)
                                break
                            case 'on':
                                if (!(value instanceof Function)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a function, but got ${nameOf(value)}.`)
                                makeMountableNode(element)
                                element.$onMount(() => element.addEventListener(descriptor.attribute.name, value as EventListener))
                                element.$onUnmount(() => element.removeEventListener(descriptor.attribute.name, value as EventListener))
                                break
                            case 'ref':
                                if (!(value instanceof SignalWritable)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(value)}.`)
                                value.set(element)
                                break
                            case 'bind':
                                if (!(value instanceof SignalWritable)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${nameOf(SignalWritable)}, but got ${typeOf(value)}.`)
                                bindToElement(value, element, descriptor.attribute.name)
                                break
                            default:
                                throw new Error(`Unknown descriptor type "${descriptor.attribute.type}".`)
                        }
                    }
            }
        }

        for (const [ref, attributes] of templateDescriptor.attributePartsMap)
        {
            const element = fragment.querySelector(`[\\:ref="${ref}"]`) as HTMLElement
            if (!element) throw new Error(`While rendering attribute parts: Could not find element with ref "${ref}".`)
            for (const [name, indexMap] of attributes)
            {
                const attributeTemplate = element.getAttribute(name)?.split(ref).filter((s) => s).flatMap((part, index) =>
                {
                    const valueIndex = indexMap[index]
                    if (valueIndex === undefined) throw new Error(`While rendering attribute parts: Could not find value index of ${index}th part of attribute "${name}" on element with ref "${ref}".`)
                    const value = values[valueIndex]
                    if (!(value instanceof SignalReadable)) throw new Error(`While rendering attribute parts: Expected ${nameOf(SignalReadable)} at index "${valueIndex}", but got ${typeOf(value)}.`)
                    return [part, value]
                })
                if (!attributeTemplate) throw new Error(`While rendering attribute parts: Could not find attribute "${name}" on element with ref "${ref}".`)
                makeMountableNode(element)
                const signal = createDerive((s) => attributeTemplate.map((part) => part instanceof SignalReadable ? s(part).value : part).join(''))
                element.$subscribe(signal, (value) => element.setAttribute(name, value), { mode: 'immediate' })
            }
        }
    }
    catch (error)
    {
        if (error instanceof Error)
        {
            console.error(`Values:`, values)
            throw new Error(`Error while rendering template: ${error.message}.\nHtml:\n${templateDescriptor.template.innerHTML.trim()}`)
        }
    }

    return Array.from(fragment.childNodes)
}