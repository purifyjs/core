import type { Element } from "domhandler"
import { ElementType, parseDocument } from "htmlparser2"
import { serializeOuter } from "parse5"
import { adapter } from "parse5-htmlparser2-tree-adapter"
import { ComponentInstance } from "."
import { randomId } from "../../utils/id"
import { Signal } from "../signal"
import { Template, TemplateAccepts } from "../template"

export async function renderComponent<T extends ComponentInstance, P extends ComponentInstance>(instance: T, parent?: { instance: P }): Promise<string>
{
    Object.defineProperty(instance, 'id', { value: randomId(), writable: false })
    const template = await instance.onRender()
    const dom = parseDocument(
        await renderTemplate(template),
        { xmlMode: true }
    ).children.find((child) => child.type === ElementType.Tag) as Element

    dom.attribs[":name"] = (instance.constructor as any).__name
    dom.attribs[':id'] = instance.id
    if (parent) 
    {
        dom.attribs[':parent-id'] = parent.instance.id
    }

    return serializeOuter(dom, { treeAdapter: adapter }) + `<script type="module">$initComponent("${instance.id}",${JSON.stringify(instance.serialize())})</script>`
}

export async function renderTemplate(template: Template): Promise<string>
{
    const parts = await Promise.all(template.parts.map(async (htmlPart, index) => `${htmlPart}${await renderParam(template.values[index])}`))
    return parts.join('')
}
export async function renderParam<T extends TemplateAccepts>(value: T): Promise<string>
{
    if (value === null || value === undefined) return ' '
    if (typeof value === "string")
    {
        return value
    }
    else if (typeof value === "number")
    {
        return value.toString()
    }
    else if (value instanceof ComponentInstance)
    {
        return await renderComponent(value)
    }
    else if (value instanceof Template)
    {
        return await renderTemplate(value)
    }
    else if (value instanceof Signal<TemplateAccepts>)
    {
        return `<span style="display:content !important" :signal="${value.id}">${await renderParam(value.value)}</span>`
    }
    else if (typeof value === "function")
    {
        throw new Error("Event listeners are not supported yet")
    }
    else
    {
        console.error("Unknown template value", value)
        throw new Error(`Cannot render ${value}`)
    }
}