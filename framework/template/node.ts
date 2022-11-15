import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"
import type { SignalDerive } from "../signal/derived"

export function valueToNode(value: unknown): Node
{
    if (value instanceof Node)
    {
        return value
    }
    else if (value instanceof Signal || value instanceof Function)
    {
        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(``)
        const endComment = document.createComment(``)
        fragment.append(startComment, endComment)

        if (value instanceof Function)
            value = injectOrGetMasterAPI(startComment).derive(value as SignalDerive<unknown>)

        if (!(value instanceof Signal)) throw new Error(`Expected value to be a Signal but got ${value}. This is not supposed to happen, ever.`)

        startComment.nodeValue = `signal ${value.id}`
        endComment.nodeValue = `/signal ${value.id}`

        let updateId = 0
        injectOrGetMasterAPI(startComment).subscribe(value, async (value) => 
        {
            const currentUpdateId = ++updateId
            if (value instanceof Promise) value = await value

            // Signal might have been changed while we were waiting for previous value.
            // If so, we kill this update.
            if (currentUpdateId !== updateId) return

            while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
            endComment.before(valueToNode(value))

        }, { mode: 'immediate' })

        return fragment
    }
    else if (value instanceof Array)
    {
        const fragment = document.createDocumentFragment()
        for (const item of value) fragment.append(valueToNode(item))
        return fragment
    }
    else
    {
        return document.createTextNode(`${value}`)
    }
}