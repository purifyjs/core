import { Component } from "../component"
import { asMountableNode, makeMountableNode } from "../mountable"
import { createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derivable"
import { SignalReadable } from "../signal/readable"
import { SignalWritable } from "../signal/writable"
import { name } from "../utils/name"
import { bindToElement } from "./bind"
import { valueToNode } from "./node"
import { parseHtml } from "./parse/html"
import { parseTemplateDescriptor, TemplateDescriptor, TemplateValueDescriptorType } from "./parse/template"

export type TemplateValue = string | number | boolean | null | undefined | Node | SignalReadable<any> | SignalDeriver<any> | Function | TemplateValue[]

export const EMPTY_NODE = document.createDocumentFragment()
const SIGNAL_TEXT = Symbol('signal_text')

export function html<S extends TemplateStringsArray, T extends TemplateValue[]>(strings: S, ...values: T)
{
    const htmlParse = parseHtml(strings)
    const templateDescriptor = parseTemplateDescriptor(htmlParse)
    return render(templateDescriptor, values)
}

export function render<T extends TemplateValue[]>(templateDescriptor: TemplateDescriptor, values: T): Node[]
{
    const fragment = document.createDocumentFragment()
    {
        const outlet = document.createElement('outlet')
        outlet.innerHTML = templateDescriptor.html
        fragment.append(...Array.from(outlet.childNodes))
    }

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
                        if (!(value instanceof Component)) throw new Error(`Expected ${Component.name} at index "${index}", but got ${name(value)}.`)
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
                        if (value instanceof SignalReadable)
                        {
                            if (descriptor.quote === '')
                            {
                                makeMountableNode(element)
                                element.$subscribe(value, (value) => element.setAttribute(descriptor.attribute.name, `${value}`), { mode: 'immediate' })
                            }
                            else
                            {
                                // This has to be handled at the end, after all attributes have been known.
                                // Or maybe not
                                throw new Error(`Not implemented yet.`)
                            }
                        }
                        else
                        {
                            if (descriptor.quote === '') element.setAttribute(descriptor.attribute.name, `${value}`)
                            else element.setAttribute(descriptor.attribute.name, `${value}`)
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
                                if (!(value instanceof Function)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a function, but got ${name(value)}.`)
                                makeMountableNode(element)
                                element.$onMount(() => element.addEventListener(descriptor.attribute.name, value as EventListener))
                                element.$onUnmount(() => element.removeEventListener(descriptor.attribute.name, value as EventListener))
                                break
                            case 'ref':
                                if (!(value instanceof SignalWritable)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${SignalWritable.name}, but got ${name(value)}.`)
                                value.set(element)
                                break
                            case 'bind':
                                if (!(value instanceof SignalWritable)) throw new Error(`${descriptor.attribute.type}:${descriptor.attribute.name} must be a ${SignalWritable.name}, but got ${name(value)}.`)
                                bindToElement(value, element, descriptor.attribute.name)
                                break
                            default:
                                throw new Error(`Unknown descriptor type "${descriptor.attribute.type}".`)
                        }
                    }
            }
        }
    }
    catch (error)
    {
        if (error instanceof Error)
            throw new Error(`Error while rendering template: ${error.message}.\nHtml:\n${templateDescriptor.html.trim()}`)
    }

    return Array.from(fragment.childNodes)
}