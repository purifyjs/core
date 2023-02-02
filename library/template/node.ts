import { EMPTY_NODE } from "."
import { assertsMountableNode } from "../mountable"
import { createOrGetDeriveOfFunction, SignalDeriver } from "../signal/derivable"
import { SignalReadable } from "../signal/readable"

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

    if (value instanceof SignalReadable || value instanceof Function)
    {
        const fragment = document.createDocumentFragment()
        const startComment = document.createComment(``)
        const endComment = document.createComment(``)
        fragment.append(startComment, endComment)

        assertsMountableNode(startComment)

        let signal: SignalReadable
        if (value instanceof Function) signal = createOrGetDeriveOfFunction(value as SignalDeriver<unknown>)
        else signal = value

        startComment.nodeValue = `signal ${signal.id}`
        endComment.nodeValue = `/signal ${signal.id}`

        startComment.$subscribe(signal, (signalValue) => 
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