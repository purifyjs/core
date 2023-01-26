import { EMPTY_NODE } from "."
import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"
import type { SignalDerive } from "../signal/derived"

export function valueToNode(value: unknown): Node
{
    if (value === null) return EMPTY_NODE

    if (value instanceof Array)
    {
        const fragment = document.createDocumentFragment()
        for (const item of value) fragment.append(valueToNode(item))
        value = fragment
    }

    if (value instanceof Node) return value

    if (value instanceof Signal || value instanceof Function)
    {
        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(``)
        const endComment = document.createComment(``)
        fragment.append(startComment, endComment)

        const m = injectOrGetMasterAPI(startComment)

        let signal: Signal
        if (value instanceof Function) signal = m.deriveFromFunction(value as SignalDerive<unknown>)
        else signal = value

        startComment.nodeValue = `signal ${signal.id}`
        endComment.nodeValue = `/signal ${signal.id}`

        let updateId = 0
        m.subscribe(signal, async (signalValue) => 
        {
            const currentUpdateId = ++updateId
            if (signalValue instanceof Promise) signalValue = await signalValue

            // Signal might have been changed while we were waiting for previous value.
            // If so, we kill this update.
            if (currentUpdateId !== updateId) return

            while (startComment.nextSibling !== endComment) startComment.nextSibling!.remove()
            endComment.before(valueToNode(signalValue))

        }, { mode: 'immediate' })

        return fragment
    }

    assertStringifyable(value)
    return document.createTextNode(value.toString())
}

const obj = {}
function assertStringifyable(value: unknown): asserts value is { toString(): string }
{
    if (!((value as any).toString instanceof Function) || (value as any).toString === (obj as any).toString)
        throw new Error(`Value ${value} is not stringifyable.`)
}