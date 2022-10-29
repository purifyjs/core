import { Element } from "domhandler"
import { parseDocument } from "htmlparser2"
import { serializeOuter } from "parse5"
import { adapter } from "parse5-htmlparser2-tree-adapter"
import { deepClone } from "../utils/clone"
import { randomId } from "../utils/id"
import { ComponentModule } from "./types"

import { createRequire } from 'module';
import { serializeObject } from "./serialize"
const require = createRequire(import.meta.url);

export async function renderComponent<M extends ComponentModule>(module: M): Promise<string>
{
    const id = randomId()

    const instance = deepClone(module)
    await instance.onRender?.()

    const { default: factory } = instance
    const template = factory()

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
        }))).join(''), { xmlMode: true }).childNodes[0] as Element

    dom.attribs['component:id'] = id

    const copy = Object.fromEntries(Object.entries(instance).filter(([key, value]) => key !== 'default'))
    return serializeOuter(dom, { treeAdapter: adapter }) +
        `<script type="module">
            // Functions needs doesnt need to be serialized they can be imported
            // Other stuf needs to be serialized
            // While functions are being called they use the instance's scope
            // And there is one more problem that i just realized, values in modules wont be visible if they are not updated, so cant serialize the whole module
            // So probably i should just use classes instead of modules probably
            // I dont wanna read and compile the code

            const self = document.currentScript
            const component = window.$mountComponent(window.$deserializeObject(${JSON.stringify(serializeObject(copy))}), document.querySelector('[component\\\\:id="${id}"]'))
            console.log(component)
        </script>`

}