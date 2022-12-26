import { EMPTY_NODE } from "."
import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"

export function valueToNode(value: unknown): Node | null
{
    if (value === null) return EMPTY_NODE
    if (value instanceof Node) return value

    if (value instanceof Signal)
    {
        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(``)
        const endComment = document.createComment(``)
        fragment.append(startComment, endComment)

        const $ = injectOrGetMasterAPI(startComment)

        startComment.nodeValue = `signal ${value.id}`
        endComment.nodeValue = `/signal ${value.id}`

        let updateId = 0
        $.subscribe(value, async (signalValue) => 
        {
            const currentUpdateId = ++updateId
            if (signalValue instanceof Promise) signalValue = await signalValue

            // Signal might have been changed while we were waiting for previous value.
            // If so, we kill this update.
            if (currentUpdateId !== updateId) return

            while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
            endComment.before(valueToNode(signalValue) ?? EMPTY_NODE)

        }, { mode: 'immediate' })

        return fragment
    }

    if (value instanceof Array)
    {
        const fragment = document.createDocumentFragment()
        for (const item of value) fragment.append(valueToNode(item) ?? EMPTY_NODE)
        return fragment
    }
    
    try 
    {
        assertStringfyable(value)
        return document.createTextNode(value.toString())
    }
    catch (error) 
    {
        return null
    }

}

const obj = {}
function assertStringfyable(value: unknown): asserts value is { toString(): string }
{
    if (!(value as any).toString || (value as any).toString === (obj as any).toString) 
        throw new Error(`Value ${value} is not stringfyable.`)
}