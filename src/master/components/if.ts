import { defineFragment } from "../framework/fragment"
import { Signal, signalDerive } from "../framework/signal"
import { html } from "../framework/template"

interface Props 
{
    if: Signal<any> | any
    then: Node
    else?: Node
}

export const If = defineFragment<Props>(({ props: { if: ifSignal, then: thenNode, else: elseNode }, onDestroy }) =>
{
    if (ifSignal instanceof Signal)
    {
        const nodeDerive = signalDerive(() => ifSignal.value ? thenNode : elseNode, ifSignal)
        onDestroy(() => nodeDerive.cleanup())
        return html`a`
    }
    else
    {
        return html`${ifSignal ? thenNode : elseNode}`
    }
})