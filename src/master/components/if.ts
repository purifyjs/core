import { defineFragment } from "../framework/fragment"
import { Signal, signalDerive } from "../framework/signal"
import { html } from "../framework/template"

interface Props 
{
    if: Signal<any> | any
    then: () => Node
    else?: () => Node
}

export const If = defineFragment<Props>(({ props: { if: condition, then: thenNode, else: elseNode }, onDestroy }) =>
{
    if (condition instanceof Signal)
    {
        const conditionDerive = signalDerive(() => !!condition.value, condition)
        onDestroy(() => conditionDerive.cleanup())
        const nodeDerive = signalDerive(() => condition.value ? thenNode() : elseNode?.(), conditionDerive)
        onDestroy(() => nodeDerive.cleanup())
        return html`${nodeDerive}`
    }
    else
    {
        return html`${condition ? thenNode() : elseNode?.()}`
    }
})