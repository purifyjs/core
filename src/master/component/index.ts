import type { Element as ParsedElement } from "domhandler"
import { parseDocument } from "htmlparser2"
import { serializeOuter } from "parse5"
import { adapter } from "parse5-htmlparser2-tree-adapter"
import { randomId } from "../../utils/id"
import type { Template } from "../template"

export interface Component extends Element
{
    $component: {
        typeId: string
        instanceId: string
        instance: ComponentInstance
    }
}

export interface ComponentFactory
{
    typeId: string
    mount(element: Element): Promise<Component>
    render(): Promise<string>
}

export abstract class ComponentInstance
{
    abstract onMount(): Promise<void>
    abstract render(): Promise<Template>
}

export function component<T extends ComponentInstance>(componentInstanceConstructor: { new(): T }): ComponentFactory
{
    const typeId = randomId()

    return {
        typeId,
        async mount(element): Promise<Component>
        {
            const component = element as Component
            const instanceId = component.getAttribute('component:id')!
            const typeId = component.getAttribute('component:type')!

            if (typeId !== this.typeId) throw new Error('Component type mismatch')

            var instance = new componentInstanceConstructor()

            component.$component = {
                instanceId,
                typeId,
                instance
            }
        
            await instance.onMount()
        
            return component
        },
        async render(): Promise<string>
        {
            const instanceId = randomId()
            const instance = new componentInstanceConstructor()
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
                    else if (typeof param === "function")
                    {
                        throw new Error("Function parameters are not supported yet")
                    }
                    else throw new Error("Invalid template param")
        
                    return `${part}${paramRef}`
                }))).join(''), { xmlMode: true }).childNodes[0] as ParsedElement
        
            dom.attribs['component:id'] = instanceId
            dom.attribs['component:type'] = typeId
        
            return serializeOuter(dom, { treeAdapter: adapter }) +
                `<script type="module">
                </script>`
        }
    }
}