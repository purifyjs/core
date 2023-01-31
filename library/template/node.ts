import { EMPTY_NODE } from "."
import { injectOrGetMasterAPI } from "../api"
import { Signal } from "../signal/base"
import { createDeriveFromFunction, SignalDeriver } from "../signal/derive"

export function valueToNode(value: unknown): Node
{
    if (value === null) return EMPTY_NODE

    if (value instanceof Array)
    {
        const fragment = document.createDocumentFragment()
        for (const item of value) fragment.append(valueToNode(item))
        return fragment
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
        if (value instanceof Function) signal = createDeriveFromFunction(value as SignalDeriver<unknown>)
        else signal = value

        startComment.nodeValue = `signal ${signal.id}`
        endComment.nodeValue = `/signal ${signal.id}`

        m.subscribe(signal, (signalValue) => 
        {
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