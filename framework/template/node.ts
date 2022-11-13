import { MasterAPI } from "../api"
import { Signal } from "../signal/base"

export function valueToNode(value: any): Node
{
    if (value instanceof Node)
    {
        return value
    }
    else if (value instanceof Signal)
    {
        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(`signal ${value.id}`)
        const endComment = document.createComment(`/signal ${value.id}`)
        fragment.append(startComment, endComment)

        let updateId = 0
        new MasterAPI(startComment).subscribe(value, async (value) => 
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