import type { Element } from "domhandler"
import { ElementType, parseDocument } from "htmlparser2"
import { serializeOuter } from "parse5"
import { adapter } from "parse5-htmlparser2-tree-adapter"
import { ComponentInstance } from "."
import { randomId } from "../../utils/id"

export async function renderComponent<T extends ComponentInstance, P extends ComponentInstance>(instance: T, parent?: { instance: P, paramIndex: number }): Promise<string>
{
    instance.id = randomId()
    const template = await instance.render()
    const dom = parseDocument((await Promise.all(
        template.parts.map(async (part, index) =>
        {
            part = part
            const param = template.params[index]
            if (!param) return part

            let paramRef: string

            if (typeof param === "string")
            {
                paramRef = param
            }
            else if (typeof param === "number")
            {
                paramRef = param.toString()
            }
            else if (param instanceof ComponentInstance)
            {
                paramRef = await renderComponent(param, { instance, paramIndex: index })
            }
            else if (typeof param === "function")
            {
                throw new Error("Function parameters are not supported yet")
            }
            else throw new Error("Invalid template param")

            return `${part}${paramRef}`
        }))).join(''), { xmlMode: true }).children.find((child) => child.type === ElementType.Tag) as Element

    dom.attribs['component:id'] = instance.id
    if (parent) dom.attribs['component:child'] = `${parent.instance.id}-${parent.paramIndex}`

    return serializeOuter(dom, { treeAdapter: adapter })
}